import configRaw from 'config';
import { differenceBy } from 'lodash-es';
import { compare as compareVersions } from 'semver';

import {
  ReleaseErrorCode,
  ReleaseModel,
  ReleaseState,
  RetryableReleaseErrorCodes,
} from '@openupm/types';
import { getVersionFromTag } from '@openupm/common/build/semver.js';
import {
  loadPackageMetadataLocal,
  packageMetadataLocalExists,
} from '@openupm/local-data';
import {
  fetchAll,
  fetchOne,
  remove,
  save,
} from '@openupm/server-common/build/models/release.js';
import {
  setInvalidTags,
  setRepoUnavailable,
} from '@openupm/server-common/build/models/packageExtra.js';
import { createLogger } from '@openupm/server-common/build/log.js';

import { addJob, getQueue } from '../queues/core.js';
import { createJobId } from '../queues/jobId.js';
import { cleanupMissingPackage } from '../jobs/cleanupMissingPackage.js';
import { gitListRemoteTags, RemoteTag } from '../utils/git.js';
import {
  GitHubReleaseAssetError,
  resolveGitHubReleaseAsset,
} from '../utils/githubReleaseAsset.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/queue/buildPackage');
const githubReleasePendingProbeInitialIntervalMs = 10 * 60 * 1000;
const githubReleasePendingProbeMaxIntervalMs = 6 * 60 * 60 * 1000;
const githubReleasePendingProbeWindowMs = 7 * 24 * 60 * 60 * 1000;

function parseGitHubRepo(
  url: string,
): { owner: string; repo: string } | null {
  if (url.startsWith('git@github.com:')) {
    const path = url.split(':')[1] || '';
    const [owner, rawRepo] = path.split('/').filter(Boolean);
    if (!owner || !rawRepo) return null;
    return { owner, repo: rawRepo.replace(/\.git$/i, '') };
  }
  try {
    const parsed = new URL(url);
    if (!/github\.com$/i.test(parsed.host)) return null;
    const [owner, rawRepo] = parsed.pathname.split('/').filter(Boolean);
    if (!owner || !rawRepo) return null;
    return { owner, repo: rawRepo.replace(/\.git$/i, '') };
  } catch {
    return null;
  }
}

export function toGitRepoUrl(url: string): string {
  const githubRepo = parseGitHubRepo(url);
  if (githubRepo) {
    // Intentionally use anonymous HTTPS for public repo tag listing.
    // If private repos or rate-limit issues become relevant, we can switch to
    // tokenized HTTPS credential injection via config-driven GitHub tokens.
    return `https://github.com/${githubRepo.owner}/${githubRepo.repo}.git`;
  }
  if (url.startsWith('git@')) return url;
  const parsed = new URL(url);
  const [owner, repo] = parsed.pathname.split('/').filter(Boolean);
  return `git@${parsed.host}:${owner}/${repo.replace(/\.git$/i, '')}.git`;
}

export async function buildPackage(name: string): Promise<void> {
  const pkg = await loadPackageMetadataLocal(name);
  if (!pkg) {
    if (!packageMetadataLocalExists(name)) {
      await cleanupMissingPackage(name);
      return;
    }
    throw new Error(`package not found: ${name}`);
  }

  let remoteTags: RemoteTag[] = [];
  try {
    remoteTags = await gitListRemoteTags(toGitRepoUrl(pkg.repoUrl));
    await setRepoUnavailable(name, false);
  } catch (error) {
    const message = (error as Error).message || '';
    if (isRepoUnavailableError(message)) {
      await setRepoUnavailable(name, true);
      if (!message.includes('Host key verification failed')) return;
    }
    throw error;
  }

  const validTags = filterRemoteTags({
    remoteTags,
    gitTagIgnore: pkg.gitTagIgnore,
    gitTagPrefix: pkg.gitTagPrefix,
    minVersion: (pkg.minVersion || '').trim(),
  }).reverse();

  const invalidTags = getInvalidTags({
    remoteTags,
    validTags,
    gitTagIgnore: pkg.gitTagIgnore,
    gitTagPrefix: pkg.gitTagPrefix,
    minVersion: (pkg.minVersion || '').trim(),
  });
  await setInvalidTags(name, invalidTags);

  const releases = await updateReleaseRecords(
    pkg.name,
    validTags,
    pkg.trackingMode || 'git',
  );
  if (!validTags.length) {
    logger.info({ pkg: name }, 'no valid tags found');
    return;
  }

  await probePendingGitHubReleaseAssets(pkg, releases);
  await addReleaseJobs(releases);
}

export function isRepoUnavailableError(message: string): boolean {
  return (
    message.includes('Host key verification failed') ||
    message.includes('ERROR: Repository not found') ||
    message.includes("could not read Username for 'https://github.com'") ||
    message.includes('fatal: Could not read from remote repository')
  );
}

export function filterRemoteTags(params: {
  remoteTags: RemoteTag[];
  gitTagIgnore?: string;
  gitTagPrefix?: string;
  minVersion?: string;
}): RemoteTag[] {
  const { remoteTags, gitTagIgnore, gitTagPrefix, minVersion } = params;
  let tags = remoteTags;

  if (gitTagPrefix) tags = tags.filter((x) => x.tag.startsWith(gitTagPrefix));
  tags = tags.filter((x) => getVersionFromTag(x.tag) != null);

  if (gitTagIgnore) {
    const ignoreRe = new RegExp(gitTagIgnore, 'i');
    tags = tags.filter((x) => !ignoreRe.test(x.tag));
  }

  const upmRe = /(^upm\/|(_|-)upm$)/i;
  const validTags = tags.filter((x) => upmRe.test(x.tag));
  const versionSet = new Set(validTags.map((x) => getVersionFromTag(x.tag)));

  if (minVersion) {
    try {
      tags = tags.filter((x) => {
        const lhs = getVersionFromTag(x.tag);
        const rhs = getVersionFromTag(minVersion);
        if (!lhs || !rhs) return false;
        return compareVersions(lhs, rhs) >= 0;
      });
    } catch {
      // ignore invalid minVersion input
    }
  }

  for (const element of tags) {
    const version = getVersionFromTag(element.tag);
    if (!versionSet.has(version)) {
      versionSet.add(version);
      validTags.push(element);
    }
  }
  return validTags;
}

export function getInvalidTags(params: {
  remoteTags: RemoteTag[];
  validTags: RemoteTag[];
  gitTagIgnore?: string;
  gitTagPrefix?: string;
  minVersion?: string;
}): RemoteTag[] {
  const { remoteTags, validTags, gitTagIgnore, gitTagPrefix, minVersion } =
    params;
  let tags = differenceBy(remoteTags, validTags, (x) => x.tag);

  if (gitTagPrefix) tags = tags.filter((x) => x.tag.startsWith(gitTagPrefix));
  if (gitTagIgnore) {
    const ignoreRe = new RegExp(gitTagIgnore, 'i');
    tags = tags.filter((x) => !ignoreRe.test(x.tag));
  }

  if (minVersion) {
    try {
      tags = tags.filter((x) => {
        const lhs = getVersionFromTag(x.tag);
        const rhs = getVersionFromTag(minVersion);
        if (!lhs || !rhs) return false;
        return compareVersions(lhs, rhs) >= 0;
      });
    } catch {
      // ignore invalid minVersion input
    }
  }

  return tags;
}

async function updateReleaseRecords(
  packageName: string,
  remoteTags: RemoteTag[],
  source: ReleaseModel['source'],
): Promise<ReleaseModel[]> {
  const existing = await fetchAll(packageName);
  for (const rel of existing) {
    if (rel.state === ReleaseState.Failed) {
      const found = remoteTags.find(
        (x) => x.tag === rel.tag && x.commit === rel.commit,
      );
      if (!found) {
        logger.warn(
          {
            pkg: packageName,
            rel: `${packageName}@${rel.version}`,
            tag: rel.tag,
            commit: rel.commit,
          },
          'remove failed release that not listed in remoteTags',
        );
        await removeStaleFailedRelease(packageName, rel);
      }
    }
  }

  const releases: ReleaseModel[] = [];
  for (const remoteTag of remoteTags) {
    const version = getVersionFromTag(remoteTag.tag);
    if (!version) continue;
    let release = await fetchOne(packageName, version);
    if (!release) {
      release = await save({
        packageName,
        version,
        commit: remoteTag.commit,
        tag: remoteTag.tag,
        source,
      });
    }
    releases.push(release);
  }
  return releases;
}

async function removeStaleFailedRelease(
  packageName: string,
  release: ReleaseModel,
): Promise<void> {
  const jobConfig = config.jobs.buildRelease;
  const queue = getQueue(jobConfig.queue);
  const jobId = createJobId(jobConfig.name, packageName, release.version);
  await queue.remove(jobId, { removeChildren: true });
  await remove(packageName, release.version);
}

async function addReleaseJobs(releases: ReleaseModel[]): Promise<void> {
  const jobConfig = config.jobs.buildRelease;
  const queue = getQueue(jobConfig.queue);
  let i = 0;

  for (const rel of releases) {
    if (
      rel.state === ReleaseState.Succeeded ||
      (rel.state === ReleaseState.Failed &&
        !RetryableReleaseErrorCodes.includes(rel.reason as ReleaseErrorCode))
    ) {
      continue;
    }

    const jobId = createJobId(jobConfig.name, rel.packageName, rel.version);
    if (rel.state === ReleaseState.Pending) {
      await removeExhaustedFailedJob(queue, jobId);
    }
    await addJob({
      queue,
      name: jobConfig.name,
      data: { name: rel.packageName, version: rel.version },
      opts: { jobId, delay: jobConfig.interval * i },
    });
    i++;
  }
}

async function removeExhaustedFailedJob(
  queue: ReturnType<typeof getQueue>,
  jobId: string,
): Promise<void> {
  const job = await queue.getJob(jobId);
  if (!job) return;

  const state = await job.getState();
  const maxAttempts = job.opts?.attempts ?? 1;
  if (state !== 'failed' || job.attemptsMade < maxAttempts) return;

  await queue.remove(jobId, { removeChildren: true });
}

export function isGitHubReleasePendingReason(reason: number): boolean {
  return (
    reason === ReleaseErrorCode.GitHubReleaseNotFound ||
    reason === ReleaseErrorCode.GitHubReleaseAssetNotFound
  );
}

export function getGitHubReleasePendingProbeIntervalMs(
  probeCount: number,
): number {
  const multiplier = 2 ** Math.max(0, probeCount);
  return Math.min(
    githubReleasePendingProbeMaxIntervalMs,
    githubReleasePendingProbeInitialIntervalMs * multiplier,
  );
}

export function getGitHubReleasePendingNextProbeAt(
  release: ReleaseModel,
): number {
  const base =
    release.githubReleaseAssetMissingLastProbeAt ||
    release.githubReleaseAssetMissingFirstSeenAt ||
    release.updatedAt;
  return (
    base +
    getGitHubReleasePendingProbeIntervalMs(
      release.githubReleaseAssetMissingProbeCount || 0,
    )
  );
}

async function probePendingGitHubReleaseAssets(
  pkg: Awaited<ReturnType<typeof loadPackageMetadataLocal>>,
  releases: ReleaseModel[],
): Promise<void> {
  if (!pkg || (pkg.trackingMode || 'git') !== 'githubRelease') return;

  for (const release of releases) {
    if (!(await shouldProbePendingGitHubReleaseAsset(release))) continue;

    const now = Date.now();
    release.githubReleaseAssetMissingFirstSeenAt ??= release.updatedAt;
    release.githubReleaseAssetMissingLastProbeAt = now;
    release.githubReleaseAssetMissingProbeCount =
      (release.githubReleaseAssetMissingProbeCount || 0) + 1;

    try {
      await resolveGitHubReleaseAsset({
        config,
        repoUrl: pkg.repoUrl,
        releaseTag: release.tag,
        githubReleaseAssetName: pkg.githubReleaseAssetName,
      });
    } catch (error) {
      if (error instanceof GitHubReleaseAssetError) {
        const saved =
          error.reason === ReleaseErrorCode.GitHubReleaseNotFound ||
          error.reason === ReleaseErrorCode.GitHubReleaseAssetNotFound ||
          error.reason === ReleaseErrorCode.GitHubReleaseApiError
            ? await save({
                ...release,
                reason:
                  error.reason === ReleaseErrorCode.GitHubReleaseApiError
                    ? release.reason
                    : error.reason,
              })
            : await save({
                ...release,
                reason: error.reason,
                githubReleaseAssetMissingFirstSeenAt: undefined,
                githubReleaseAssetMissingLastProbeAt: undefined,
                githubReleaseAssetMissingProbeCount: undefined,
              });
        Object.assign(release, saved);
        continue;
      }
      throw error;
    }

    const jobConfig = config.jobs.buildRelease;
    const queue = getQueue(jobConfig.queue);
    const jobId = createJobId(jobConfig.name, release.packageName, release.version);
    await queue.remove(jobId, { removeChildren: true });
    const resetRelease = await save({
      ...release,
      state: ReleaseState.Pending,
      reason: ReleaseErrorCode.None,
      buildId: '',
      signed: false,
      publishedVersion: undefined,
      githubReleaseAssetMissingFirstSeenAt: undefined,
      githubReleaseAssetMissingLastProbeAt: undefined,
      githubReleaseAssetMissingProbeCount: undefined,
    });
    Object.assign(release, resetRelease);
    logger.info(
      { rel: `${release.packageName}@${release.version}` },
      'GitHub Release asset is available; release requeued',
    );
  }
}

async function shouldProbePendingGitHubReleaseAsset(
  release: ReleaseModel,
): Promise<boolean> {
  if (
    release.state !== ReleaseState.Failed ||
    !isGitHubReleasePendingReason(release.reason)
  ) {
    return false;
  }

  const firstSeenAt =
    release.githubReleaseAssetMissingFirstSeenAt || release.updatedAt;
  const now = Date.now();
  if (now - firstSeenAt > githubReleasePendingProbeWindowMs) return false;

  if (now < getGitHubReleasePendingNextProbeAt(release)) return false;

  const jobConfig = config.jobs.buildRelease;
  const queue = getQueue(jobConfig.queue);
  const job = await queue.getJob(
    createJobId(jobConfig.name, release.packageName, release.version),
  );
  if (!job) return false;

  const state = await job.getState();
  const maxAttempts = job.opts?.attempts ?? 1;
  return state === 'failed' && job.attemptsMade >= maxAttempts;
}
