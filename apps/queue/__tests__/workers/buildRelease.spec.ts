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
});
