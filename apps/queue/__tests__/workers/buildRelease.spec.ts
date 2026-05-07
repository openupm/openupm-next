import { describe, expect, it } from 'vitest';

import { ReleaseErrorCode, RetryableReleaseErrorCodes } from '@openupm/types';
import { getReasonFromBuildLogText } from '../../src/workers/buildRelease.js';

describe('buildRelease.getReasonFromBuildLogText', () => {
  it('None', () => {
    expect(getReasonFromBuildLogText('')).toEqual(ReleaseErrorCode.None);
  });

  it('basic npm codes', () => {
    expect(getReasonFromBuildLogText('error code E400')).toEqual(
      ReleaseErrorCode.BadRequest,
    );
    expect(getReasonFromBuildLogText('error code E401')).toEqual(
      ReleaseErrorCode.Unauthorized,
    );
    expect(getReasonFromBuildLogText('error code E403')).toEqual(
      ReleaseErrorCode.Forbidden,
    );
    expect(getReasonFromBuildLogText('error code E409')).toEqual(
      ReleaseErrorCode.VersionConflict,
    );
  });

  it('PackageNameInvalid', () => {
    expect(
      getReasonFromBuildLogText(
        'error code E400\\nerror 400 Bad Request - PUT https://package.***.com/@umm%2fcanvas_resizer - unsupported registry call',
      ),
    ).toEqual(ReleaseErrorCode.PackageNameInvalid);
  });

  it('NpmHookError and non-retryable', () => {
    expect(
      getReasonFromBuildLogText(`
/opt/hostedtoolcache/node/22.22.0/x64/bin/npm publish --tag=patch-3.0.0
sh: 1: markdownlint: not found
npm error command failed
> com.wallstop-studios.unity-helpers@3.0.0 prepublishOnly`),
    ).toEqual(ReleaseErrorCode.NpmHookError);

    expect(
      RetryableReleaseErrorCodes.includes(ReleaseErrorCode.NpmHookError),
    ).toBe(false);
  });

  it('submodule and lfs errors', () => {
    expect(
      getReasonFromBuildLogText(
        "fatal: Fetched in submodule path 'ext/iOS/sdk', but it did not contain 875b462e73a2619f4a834bf5a009ed760d4789bd.\nDirect fetching of that commit failed.",
      ),
    ).toEqual(ReleaseErrorCode.SubmoduleFetchingError);

    expect(
      getReasonFromBuildLogText(
        "fatal: No url found for submodule path 'SDKs/nakama-cpp' in .gitmodules",
      ),
    ).toEqual(ReleaseErrorCode.RemoteSubmoduleUnavailable);

    expect(
      getReasonFromBuildLogText(
        'batch response: This repository exceeded its LFS budget.',
      ),
    ).toEqual(ReleaseErrorCode.LfsBudgetExceeded);

    expect(
      getReasonFromBuildLogText('Object does not exist on the server'),
    ).toEqual(ReleaseErrorCode.LfsObjectNotFound);
  });

  it('RemoteBranchNotFound and InvalidVersion', () => {
    expect(
      getReasonFromBuildLogText('fatal: Remote branch 4.7.1a not found in upstream origin'),
    ).toEqual(ReleaseErrorCode.RemoteBranchNotFound);

    expect(getReasonFromBuildLogText('error Invalid version: "0.1"')).toEqual(
      ReleaseErrorCode.InvalidVersion,
    );
  });

  it('GitHub Release asset download errors are retryable', () => {
    expect(
      getReasonFromBuildLogText('GITHUB_RELEASE_ASSET_DOWNLOAD_NOT_FOUND'),
    ).toEqual(ReleaseErrorCode.GitHubReleaseAssetNotFound);
    expect(
      getReasonFromBuildLogText('GITHUB_RELEASE_ASSET_DOWNLOAD_FAILED'),
    ).toEqual(ReleaseErrorCode.GitHubReleaseAssetDownloadFailed);
    expect(
      RetryableReleaseErrorCodes.includes(
        ReleaseErrorCode.GitHubReleaseAssetNotFound,
      ),
    ).toBe(true);
    expect(
      RetryableReleaseErrorCodes.includes(
        ReleaseErrorCode.GitHubReleaseAssetDownloadFailed,
      ),
    ).toBe(true);
  });

  it('GitHub Release asset validation errors are non-retryable', () => {
    expect(
      getReasonFromBuildLogText('Unsupported package asset extension'),
    ).toEqual(ReleaseErrorCode.PackageJsonParsingError);
    expect(
      getReasonFromBuildLogText(
        'Downloaded package asset has no package/package.json',
      ),
    ).toEqual(ReleaseErrorCode.PackageNotFound);
    expect(
      getReasonFromBuildLogText(
        'Downloaded package asset name mismatch: actual=package-a, expected=package-b',
      ),
    ).toEqual(ReleaseErrorCode.PackageNameInvalid);
    expect(
      getReasonFromBuildLogText(
        'Downloaded package asset version mismatch: actual=1.0.0, expected=2.0.0',
      ),
    ).toEqual(ReleaseErrorCode.InvalidVersion);
    expect(
      RetryableReleaseErrorCodes.includes(
        ReleaseErrorCode.PackageJsonParsingError,
      ),
    ).toBe(false);
  });
});
