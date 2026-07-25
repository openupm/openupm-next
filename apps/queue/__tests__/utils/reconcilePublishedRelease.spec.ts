import { describe, expect, it, vi } from 'vitest';

import { ReleaseErrorCode, ReleaseState } from '@openupm/types';
import {
  markReleasePublished,
  reconcilePublishedRelease,
} from '../../src/utils/reconcilePublishedRelease.js';

const release = {
  packageName: 'com.foo.bar',
  version: '1.2.3',
  state: ReleaseState.Building,
  reason: ReleaseErrorCode.None,
  buildId: 'expired-build',
  tag: 'upm/1.2.3',
  commit: 'abc123',
  createdAt: 100,
  updatedAt: 200,
  source: 'git' as const,
  signed: false,
};

describe('reconcilePublishedRelease', () => {
  it('marks a registry-confirmed release as succeeded', async () => {
    const isReleasePublished = vi.fn().mockResolvedValue(true);
    const save = vi.fn(async (value) => value);

    const result = await reconcilePublishedRelease(release, {
      isReleasePublished,
      save: save as never,
    });

    expect(isReleasePublished).toHaveBeenCalledWith('com.foo.bar', '1.2.3');
    expect(save).toHaveBeenCalledWith({
      ...release,
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      buildId: '',
      signed: false,
      publishedVersion: '1.2.3',
      githubReleaseAssetMissingFirstSeenAt: undefined,
      githubReleaseAssetMissingLastProbeAt: undefined,
      githubReleaseAssetMissingProbeCount: undefined,
    });
    expect(result).toMatchObject({
      state: ReleaseState.Succeeded,
      publishedVersion: '1.2.3',
    });
  });

  it('does not save when the version is absent from the registry', async () => {
    const save = vi.fn();

    await expect(
      reconcilePublishedRelease(release, {
        isReleasePublished: vi.fn().mockResolvedValue(false),
        save: save as never,
      }),
    ).resolves.toBeNull();

    expect(save).not.toHaveBeenCalled();
  });
});

describe('markReleasePublished', () => {
  it('discards unverified signing metadata while clearing the stale build', async () => {
    const save = vi.fn(async (value) => value);

    await markReleasePublished(
      {
        ...release,
        signed: true,
        publishedVersion: '1.2.3-signed',
      },
      save as never,
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        state: ReleaseState.Succeeded,
        reason: ReleaseErrorCode.None,
        buildId: '',
        signed: false,
        publishedVersion: '1.2.3',
      }),
    );
  });
});
