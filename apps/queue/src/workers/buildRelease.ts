import configRaw from 'config';
import superagent from 'superagent';
import util from 'util';

import {
  ReleaseErrorCode,
  ReleaseModel,
  ReleaseState,
  RetryableReleaseErrorCodes,
  type PackageMetadataLocal,
} from '@openupm/types';
import { loadPackageMetadataLocal } from '@openupm/local-data';
import {
  fetchOneOrThrow,
  save,
} from '@openupm/server-common/build/models/release.js';
import { createLogger } from '@openupm/server-common/build/log.js';

import {
  BuildResult,
  BuildStatus,
  getBuildApi,
  getBuildLogsUrl,
  getBuildSectionLogUrl,
  queueBuild,
  waitBuild,
} from '../utils/azure.js';
import {
  GitHubReleaseAssetError,
  resolveGitHubReleaseAsset,
} from '../utils/githubReleaseAsset.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const sleep = util.promisify(setTimeout);
const logger = createLogger('@openupm/queue/buildRelease');

export async function buildRelease(
  packageName: string,
  version: string,
): Promise<void> {
  let release = await fetchOneOrThrow(packageName, version);
  const pkg = await loadPackageMetadataLocal(release.packageName);
  if (!pkg) throw new Error(`package not found: ${release.packageName}`);

  const shouldContinue = await updateReleaseState(release);
  if (!shouldContinue) return;

  try {
    const buildApi = await getBuildApi();
    release = await updateReleaseBuild(buildApi, pkg, release);
    const build = await waitReleaseBuild(buildApi, release);
    await handleReleaseBuild(build, release);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
      release.state = ReleaseState.Failed;
      release.reason = ReleaseErrorCode.ConnectionTimeout;
      await save(release);
      logReleaseError(release);
    } else if (err instanceof GitHubReleaseAssetError) {
      release.state = ReleaseState.Failed;
      release.reason = err.reason;
      await save(release);
      logReleaseError(release);
    }
    throw err;
  }
}

async function updateReleaseState(release: ReleaseModel): Promise<boolean> {
  if (release.state === ReleaseState.Succeeded) {
    logger.debug(
      { rel: `${release.packageName}@${release.version}` },
      'skip successful release',
    );
    return false;
  }

  if (
    release.state === ReleaseState.Failed &&
    release.reason === ReleaseErrorCode.BuildTimeout
  ) {
    release.state = ReleaseState.Building;
    release.reason = ReleaseErrorCode.None;
    await save(release);
    return true;
  }

  if (
    release.state === ReleaseState.Pending ||
    release.state === ReleaseState.Failed
  ) {
    release.state = ReleaseState.Building;
    release.buildId = '';
    await save(release);
    return true;
  }

  return true;
}

async function updateReleaseBuild(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildApi: any,
  pkg: PackageMetadataLocal,
  release: ReleaseModel,
): Promise<ReleaseModel> {
  if (!release.buildId) {
    logger.info({ rel: `${release.packageName}@${release.version}` }, 'queue build');
    if (!pkg) throw new Error(`package not found: ${release.packageName}`);
    const parameters = await getQueueBuildParameters(pkg, release);
    const build = await queueBuild(buildApi, config.azureDevops.definitionId, {
      ...parameters,
    });
    release.buildId = `${build.id}`;
    release = await save(release);
    await sleep(config.azureDevops.check.duration);
  }
  return release;
}

export async function getQueueBuildParameters(
  pkg: PackageMetadataLocal,
  release: ReleaseModel,
): Promise<Record<string, string>> {
  const baseParameters = {
    repoUrl: pkg.repoUrl,
    repoBranch: release.tag,
    packageName: release.packageName,
    packageVersion: release.version,
  };

  if ((pkg.trackingMode || 'git') === 'git') {
    return {
      ...baseParameters,
      packageSource: 'git',
    };
  }

  const resolvedAsset = await resolveGitHubReleaseAsset({
    config,
    repoUrl: pkg.repoUrl,
    releaseTag: release.tag,
    githubReleaseAssetName: pkg.githubReleaseAssetName,
  });

  return {
    ...baseParameters,
    packageSource: 'githubRelease',
    packageAssetUrl: resolvedAsset.packageAssetUrl,
    packageAssetName: resolvedAsset.packageAssetName,
  };
}

async function waitReleaseBuild(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildApi: any,
  release: ReleaseModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  logger.debug(
    { rel: `${release.packageName}@${release.version}`, buildId: release.buildId },
    'wait build',
  );
  return await waitBuild(buildApi, release.buildId);
}

async function handleReleaseBuild(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: any | null,
  release: ReleaseModel,
): Promise<void> {
  let fullLogText = '';
  if (release.buildId) {
    fullLogText = await getFullBuildLogText(release.buildId);
  }

  if (
    build &&
    build.status === BuildStatus.Completed &&
    build.result === BuildResult.Succeeded
  ) {
    release.state = ReleaseState.Succeeded;
    release.reason = ReleaseErrorCode.None;
    await save(release);
    logger.info(
      { rel: `${release.packageName}@${release.version}`, build: release.buildId },
      'build succeeded',
    );
    return;
  }

  let reason: ReleaseErrorCode = ReleaseErrorCode.None;
  if (build === null) reason = ReleaseErrorCode.BuildTimeout;
  else if (build.status === BuildStatus.Cancelling)
    reason = ReleaseErrorCode.BuildCancellation;
  else reason = getReasonFromBuildLogText(fullLogText);

  release.state = ReleaseState.Failed;
  release.reason = reason;
  await save(release);
  logReleaseError(release);

  if (RetryableReleaseErrorCodes.includes(reason)) {
    throw new Error(
      `build ${release.packageName}@${release.version} failed with retryable reason: ${reason}`,
    );
  }
}

function logReleaseError(release: ReleaseModel): void {
  logger.error(
    {
      rel: `${release.packageName}@${release.version}`,
      build: release.buildId,
      reason: release.reason,
    },
    'release failed',
  );
}

async function getFullBuildLogText(buildId: string): Promise<string> {
  const buildLogsUrl = getBuildLogsUrl(buildId);
  const resp = await superagent.get(buildLogsUrl).type('json');
  const lastStepId = resp.body.value[resp.body.value.length - 1].id;

  const buildLogSectionUrl = getBuildSectionLogUrl(buildId, lastStepId);
  const resp2 = await superagent.get(buildLogSectionUrl);
  return resp2.text;
}

export function getReasonFromBuildLogText(text: string): ReleaseErrorCode {
  if (
    text.includes('npm publish') &&
    /(^|\n)(?:\S+\s+)?>\s+.+@\S+\s+(prepublishOnly|prepack|prepare|postpack|publish|postpublish)\s*($|\n)/m.test(
      text,
    ) &&
    /npm error command failed|sh:\s+\d+:\s+.+:\s+not found|Error: Cannot find module/m.test(
      text,
    )
  )
    return ReleaseErrorCode.NpmHookError;
  if (/fatal: Remote branch .* not found/.test(text))
    return ReleaseErrorCode.RemoteBranchNotFound;
  else if (text.includes('code E409')) return ReleaseErrorCode.VersionConflict;
  else if (
    (text.includes('ENOENT') && text.includes('error path package.json')) ||
    text.includes('Downloaded package asset has no package/package.json')
  )
    return ReleaseErrorCode.PackageNotFound;
  else if (text.includes('code E400')) {
    if (/400 Bad Request - PUT https:\/\/.*\.com\/@/.test(text)) {
      return ReleaseErrorCode.PackageNameInvalid;
    }
    return ReleaseErrorCode.BadRequest;
  } else if (text.includes('code E401')) return ReleaseErrorCode.Unauthorized;
  else if (text.includes('code E403')) return ReleaseErrorCode.Forbidden;
  else if (text.includes('code E413')) return ReleaseErrorCode.EntityTooLarge;
  else if (text.includes('code E500')) return ReleaseErrorCode.InternalError;
  else if (text.includes('code E502')) return ReleaseErrorCode.BadGateway;
  else if (text.includes('code E503'))
    return ReleaseErrorCode.ServiceUnavailable;
  else if (text.includes('code E504')) return ReleaseErrorCode.GatewayTimeout;
  else if (text.includes('code EPRIVATE')) return ReleaseErrorCode.Private;
  else if (
    text.includes('code EJSONPARSE') ||
    text.includes('Unsupported package asset extension') ||
    text.includes('Downloaded package asset is not a valid tar archive') ||
    text.includes('Downloaded package asset package.json is not valid JSON')
  )
    return ReleaseErrorCode.PackageJsonParsingError;
  else if (
    text.includes('code ERR_STRING_TOO_LONG') ||
    text.includes('JavaScript heap out of memory')
  )
    return ReleaseErrorCode.HeapOutOfMemroy;
  else if (text.includes('This repository exceeded its LFS budget'))
    return ReleaseErrorCode.LfsBudgetExceeded;
  else if (text.includes('Object does not exist on the server'))
    return ReleaseErrorCode.LfsObjectNotFound;
  else if (text.includes('GITHUB_RELEASE_ASSET_DOWNLOAD_NOT_FOUND'))
    return ReleaseErrorCode.GitHubReleaseAssetNotFound;
  else if (text.includes('GITHUB_RELEASE_ASSET_DOWNLOAD_FAILED'))
    return ReleaseErrorCode.GitHubReleaseAssetDownloadFailed;
  else if (text.includes('Downloaded package asset name mismatch'))
    return ReleaseErrorCode.PackageNameInvalid;
  else if (text.includes('Downloaded package asset version mismatch'))
    return ReleaseErrorCode.InvalidVersion;
  else if (text.includes('Invalid version') || text.includes('code EBADSEMVER'))
    return ReleaseErrorCode.InvalidVersion;
  else if (text.includes('Could not read from remote repository'))
    return ReleaseErrorCode.RemoteRepositoryUnavailable;
  else if (
    /Fetched in submodule path .*?\s+Direct fetching of that commit failed\./s.test(
      text,
    )
  )
    return ReleaseErrorCode.SubmoduleFetchingError;
  else if (/fatal: No url found for submodule path .* in \.gitmodules/.test(text))
    return ReleaseErrorCode.RemoteSubmoduleUnavailable;
  else if (/fatal: clone of .* into submodule path/.test(text))
    return ReleaseErrorCode.RemoteSubmoduleUnavailable;

  return ReleaseErrorCode.None;
}
