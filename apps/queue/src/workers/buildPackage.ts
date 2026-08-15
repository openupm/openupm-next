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
import { markReleasePublished } from '../utils/reconcilePublishedRelease.js';
import { isReleasePublished } from '../utils/registry.js';
import {
  ReleaseMutationLockedError,
  withReleaseMutationLock,
} from '../utils/releaseMutationLock.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/queue/buildPackage');
const githubReleasePendingProbeInitialIntervalMs = 10 * 60 * 1000;
const githubReleasePendingProbeMaxIntervalMs = 6 * 60 * 60 * 1000;
const githubReleasePendingProbeWindowMs = 3 * 24 * 60 * 60 * 1000;

function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
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
        await withPackageScanReleaseLock(packageName, rel.version, async () => {
          const current = await fetchOne(packageName, rel.version);
          if (
            !current ||
            current.state !== ReleaseState.Failed ||
            remoteTags.some(
              (x) => x.tag === current.tag && x.commit === current.commit,
            )
          ) {
            return;
          }
          logger.warn(
            {
              pkg: packageName,
              rel: `${packageName}@${current.version}`,
              tag: current.tag,
              commit: current.commit,
            },
            'remove failed release that not listed in remoteTags',
          );
          await removeStaleFailedRelease(packageName, current);
        });
      }
    }
  }

  const releases: ReleaseModel[] = [];
  for (const remoteTag of remoteTags) {
    const version = getVersionFromTag(remoteTag.tag);
    if (!version) continue;
    const release = await withPackageScanReleaseLock(
      packageName,
      version,
      async () => {
        const current = await fetchOne(packageName, version);
        if (current) {
          if (
            current.state === ReleaseState.Failed &&
            (current.source || 'git') !== source
          ) {
            let published: boolean;
            try {
              published = await isReleasePublished(
                current.packageName,
                current.version,
              );
            } catch (error) {
              logger.warn(
                {
                  err: error,
                  rel: `${packageName}@${current.version}`,
                },
                'skip tracking source change while registry check fails',
              );
              return current;
            }
            if (published) return await markReleasePublished(current);

            logger.info(
              {
                pkg: packageName,
                rel: `${packageName}@${current.version}`,
                from: current.source || 'git',
                to: source,
              },
              'requeue failed release after tracking source change',
            );
            return await save({
              ...current,
              state: ReleaseState.Pending,
              reason: ReleaseErrorCode.None,
              buildId: '',
              source,
              signed: false,
              publishedVersion: undefined,
              githubReleaseAssetMissingFirstSeenAt: undefined,
              githubReleaseAssetMissingLastProbeAt: undefined,
              githubReleaseAssetMissingProbeCount: undefined,
            });
          }
          return current;
        }
        return await save({
          packageName,
          version,
          commit: remoteTag.commit,
          tag: remoteTag.tag,
          source,
        });
      },
    );
    if (release) releases.push(release);
  }
  return releases;
}

async function withPackageScanReleaseLock<T>(
  packageName: string,
  version: string,
  action: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await withReleaseMutationLock(packageName, version, action);
  } catch (error) {
    if (!(error instanceof ReleaseMutationLockedError)) throw error;
    logger.info(
      { rel: `${packageName}@${version}` },
      'skip release mutation while another repair is in progress',
    );
    return undefined;
  }
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

export async function addReleaseJobs(releases: ReleaseModel[]): Promise<void> {
  const jobConfig = config.jobs.buildRelease;
  const queue = getQueue(jobConfig.queue);
  let i = 0;

  for (const rel of releases) {
    await withPackageScanReleaseLock(rel.packageName, rel.version, async () => {
      const current = await fetchOne(rel.packageName, rel.version);
      if (!current) {
        return;
      }

      const jobId = createJobId(
        jobConfig.name,
        current.packageName,
        current.version,
      );
      if (await recoverPublishedBuildTimeout(queue, jobId, current)) return;

      if (
        current.state === ReleaseState.Succeeded ||
        (current.state === ReleaseState.Failed &&
          !RetryableReleaseErrorCodes.includes(
            current.reason as ReleaseErrorCode,
          ))
      ) {
        return;
      }

      if (isExpiredGitHubReleasePendingFailure(current)) {
        await removeExhaustedFailedJob(queue, jobId);
        return;
      }
      if (current.state === ReleaseState.Pending) {
        await removeExhaustedFailedJob(queue, jobId);
      }
      await addJob({
        queue,
        name: jobConfig.name,
        data: {
          name: current.packageName,
          version: current.version,
        },
        opts: { jobId, delay: jobConfig.interval * i },
      });
      i++;
    });
  }
}

async function recoverPublishedBuildTimeout(
  queue: ReturnType<typeof getQueue>,
  jobId: string,
  release: ReleaseModel,
): Promise<boolean> {
  const isBuildTimeout =
    release.state === ReleaseState.Failed &&
    release.reason === ReleaseErrorCode.BuildTimeout;
  const isReconciledCleanup =
    release.state === ReleaseState.Succeeded &&
    release.reason === ReleaseErrorCode.None &&
    release.buildId === '' &&
    release.publishedVersion === release.version;
  if (!isBuildTimeout && !isReconciledCleanup) return false;

  const job = await queue.getJob(jobId);
  if (!job) return false;

  const state = await job.getState();
  const maxAttempts = job.opts?.attempts ?? 1;
  if (state !== 'failed' || job.attemptsMade < maxAttempts) return false;

  let published: boolean;
  try {
    published = await isReleasePublished(release.packageName, release.version);
  } catch (error) {
    logger.warn(
      {
        err: error,
        rel: `${release.packageName}@${release.version}`,
        jobId,
      },
      'published build timeout registry check failed',
    );
    return false;
  }
  if (!published) return false;

  await markReleasePublished(release);

  const removed = await queue.remove(jobId, { removeChildren: true });
  logger.info(
    {
      rel: `${release.packageName}@${release.version}`,
      jobId,
      removed: removed === 1,
    },
    isBuildTimeout
      ? 'published build timeout reconciled'
      : 'reconciled release failed job cleanup completed',
  );
  return true;
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

  for (const snapshot of releases) {
    await withPackageScanReleaseLock(
      snapshot.packageName,
      snapshot.version,
      async () => {
        const release = await fetchOne(snapshot.packageName, snapshot.version);
        if (
          !release ||
          !(await shouldProbePendingGitHubReleaseAsset(release))
        ) {
          return;
        }

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
            await save(
              error.reason === ReleaseErrorCode.GitHubReleaseNotFound ||
                error.reason === ReleaseErrorCode.GitHubReleaseAssetNotFound ||
                error.reason === ReleaseErrorCode.GitHubReleaseApiError
                ? {
                    ...release,
                    reason:
                      error.reason === ReleaseErrorCode.GitHubReleaseApiError
                        ? release.reason
                        : error.reason,
                  }
                : {
                    ...release,
                    reason: error.reason,
                    githubReleaseAssetMissingFirstSeenAt: undefined,
                    githubReleaseAssetMissingLastProbeAt: undefined,
                    githubReleaseAssetMissingProbeCount: undefined,
                  },
            );
            return;
          }
          throw error;
        }

        const jobConfig = config.jobs.buildRelease;
        const queue = getQueue(jobConfig.queue);
        const jobId = createJobId(
          jobConfig.name,
          release.packageName,
          release.version,
        );
        await queue.remove(jobId, { removeChildren: true });
        await save({
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
        logger.info(
          { rel: `${release.packageName}@${release.version}` },
          'GitHub Release asset is available; release requeued',
        );
      },
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

  const now = Date.now();
  if (isGitHubReleasePendingProbeWindowExpired(release, now)) return false;

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

function isGitHubReleasePendingProbeWindowExpired(
  release: ReleaseModel,
  now = Date.now(),
): boolean {
  const firstSeenAt =
    release.githubReleaseAssetMissingFirstSeenAt || release.updatedAt;
  return now - firstSeenAt > githubReleasePendingProbeWindowMs;
}

function isExpiredGitHubReleasePendingFailure(release: ReleaseModel): boolean {
  return (
    release.state === ReleaseState.Failed &&
    isGitHubReleasePendingReason(release.reason) &&
    isGitHubReleasePendingProbeWindowExpired(release)
  );
}
