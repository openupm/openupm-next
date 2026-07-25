import {
  ReleaseErrorCode,
  type ReleaseModel,
  ReleaseState,
} from '@openupm/types';
import { save } from '@openupm/server-common/build/models/release.js';

import { isReleasePublished } from './registry.js';

interface ReconcilePublishedReleaseDependencies {
  isReleasePublished: typeof isReleasePublished;
  save: typeof save;
}

const defaultDependencies: ReconcilePublishedReleaseDependencies = {
  isReleasePublished,
  save,
};

export async function markReleasePublished(
  release: ReleaseModel,
  saveRelease: typeof save = save,
): Promise<ReleaseModel> {
  return await saveRelease({
    ...release,
    state: ReleaseState.Succeeded,
    reason: ReleaseErrorCode.None,
    buildId: '',
    signed: false,
    publishedVersion: release.version,
    githubReleaseAssetMissingFirstSeenAt: undefined,
    githubReleaseAssetMissingLastProbeAt: undefined,
    githubReleaseAssetMissingProbeCount: undefined,
  });
}

export async function reconcilePublishedRelease(
  release: ReleaseModel,
  dependencies: ReconcilePublishedReleaseDependencies = defaultDependencies,
): Promise<ReleaseModel | null> {
  if (
    !(await dependencies.isReleasePublished(
      release.packageName,
      release.version,
    ))
  ) {
    return null;
  }

  return await markReleasePublished(release, dependencies.save);
}
