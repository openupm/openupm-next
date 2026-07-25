import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReleaseErrorCode, ReleaseState } from '@openupm/types';

const queueRemoveMock = vi.fn();
const queueAddMock = vi.fn();
const getQueueMock = vi.fn(() => ({
  remove: queueRemoveMock,
  add: queueAddMock,
}));
const hasQueueMock = vi.fn((name: string) => name === 'pkg' || name === 'rel');
const addJobMock = vi.fn();
const closeQueuesMock = vi.fn();
const fetchAllMock = vi.fn();
const backfillRecentReleaseIndexesMock = vi.fn();
const fetchOneMock = vi.fn();
const removeReleaseRecordMock = vi.fn();
const saveReleaseMock = vi.fn();
const redisCloseMock = vi.fn();
const packageMetadataLocalExistsMock = vi.fn();
const isReleasePublishedMock = vi.fn();
const markReleasePublishedMock = vi.fn();
const withReleaseMutationLockMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
}));

vi.mock('../src/queues/core.js', () => ({
  addJob: addJobMock,
  closeQueues: closeQueuesMock,
  getQueue: getQueueMock,
  hasQueue: hasQueueMock,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  backfillRecentReleaseIndexes: backfillRecentReleaseIndexesMock,
  fetchAll: fetchAllMock,
  fetchOne: fetchOneMock,
  remove: removeReleaseRecordMock,
  save: saveReleaseMock,
}));

vi.mock('@openupm/server-common/build/redis.js', () => ({
  default: {
    close: redisCloseMock,
    client: {
      scan: vi.fn(),
    },
  },
}));

vi.mock('../src/utils/registry.js', () => ({
  isReleasePublished: isReleasePublishedMock,
}));

vi.mock('../src/utils/reconcilePublishedRelease.js', () => ({
  markReleasePublished: markReleasePublishedMock,
}));

vi.mock('../src/utils/releaseMutationLock.js', () => ({
  withReleaseMutationLock: withReleaseMutationLockMock,
}));

describe('queue-cli destructive actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    getQueueMock.mockReturnValue({
      remove: queueRemoveMock,
      add: queueAddMock,
      getJobCounts: vi.fn().mockResolvedValue({ failed: 0 }),
      getJobs: vi.fn().mockResolvedValue([]),
      getJob: vi.fn().mockResolvedValue({
        getState: vi.fn().mockResolvedValue('failed'),
      }),
    });
    hasQueueMock.mockImplementation(
      (name: string) => name === 'pkg' || name === 'rel',
    );
    queueRemoveMock.mockResolvedValue(1);
    packageMetadataLocalExistsMock.mockReturnValue(true);
    isReleasePublishedMock.mockResolvedValue(true);
    withReleaseMutationLockMock.mockImplementation(
      async (_packageName, _version, action) => await action(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remove-job removes only the requested BullMQ job', async () => {
    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'remove-job',
      'rel',
      'build-rel|com.foo.bar|1.2.3',
      '--json',
    ]);

    expect(getQueueMock).toHaveBeenCalledWith('rel');
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.foo.bar|1.2.3',
      {
        removeChildren: true,
      },
    );
    expect(removeReleaseRecordMock).not.toHaveBeenCalled();
    expect(saveReleaseMock).not.toHaveBeenCalled();
    expect(addJobMock).not.toHaveBeenCalled();
    expect(closeQueuesMock).toHaveBeenCalled();
    expect(redisCloseMock).toHaveBeenCalled();
  });

  it('release-remove deletes the release record and deterministic rel job', async () => {
    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-remove',
      'com.foo.bar',
      '1.2.3',
      '--json',
    ]);

    expect(getQueueMock).toHaveBeenCalledWith('rel');
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.foo.bar|1.2.3',
      {
        removeChildren: true,
      },
    );
    expect(removeReleaseRecordMock).toHaveBeenCalledWith(
      'com.foo.bar',
      '1.2.3',
    );
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('release-requeue resets release state and enqueues one deterministic rel job', async () => {
    const release = {
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Failed,
      reason: ReleaseErrorCode.BuildTimeout,
      buildId: '12345',
      tag: 'upm/1.2.3',
      commit: 'abc123',
      createdAt: 100,
      updatedAt: 200,
      githubReleaseAssetMissingFirstSeenAt: 150,
      githubReleaseAssetMissingLastProbeAt: 190,
      githubReleaseAssetMissingProbeCount: 2,
    };
    fetchOneMock.mockResolvedValue(release);
    saveReleaseMock.mockImplementation(async (value) => ({
      ...value,
      updatedAt: 300,
    }));
    addJobMock.mockResolvedValue({ id: 'build-rel|com.foo.bar|1.2.3' });

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-requeue',
      'com.foo.bar',
      '1.2.3',
      '--json',
    ]);

    expect(fetchOneMock).toHaveBeenCalledWith('com.foo.bar', '1.2.3');
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.foo.bar|1.2.3',
      {
        removeChildren: true,
      },
    );
    expect(saveReleaseMock).toHaveBeenCalledWith({
      ...release,
      state: ReleaseState.Pending,
      reason: ReleaseErrorCode.None,
      buildId: '',
      githubReleaseAssetMissingFirstSeenAt: undefined,
      githubReleaseAssetMissingLastProbeAt: undefined,
      githubReleaseAssetMissingProbeCount: undefined,
    });
    expect(addJobMock).toHaveBeenCalledWith({
      queue: expect.anything(),
      name: 'build-rel',
      data: { name: 'com.foo.bar', version: '1.2.3' },
      opts: { jobId: 'build-rel|com.foo.bar|1.2.3' },
    });
    expect(removeReleaseRecordMock).not.toHaveBeenCalled();
  });

  it('release-reconcile-published verifies and repairs a published release', async () => {
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
    };
    const reconciled = {
      ...release,
      state: ReleaseState.Succeeded,
      buildId: '',
      publishedVersion: '1.2.3',
      updatedAt: 300,
    };
    fetchOneMock.mockResolvedValue(release);
    markReleasePublishedMock.mockResolvedValue(reconciled);

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-reconcile-published',
      'com.foo.bar',
      '1.2.3',
      '--json',
    ]);

    expect(isReleasePublishedMock).toHaveBeenCalledWith('com.foo.bar', '1.2.3');
    expect(markReleasePublishedMock).toHaveBeenCalledWith(release);
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.foo.bar|1.2.3',
      { removeChildren: true },
    );
    expect(addJobMock).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"state": "Succeeded"'),
    );
  });

  it('release-reconcile-published leaves an unpublished release unchanged', async () => {
    const release = {
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Building,
      reason: ReleaseErrorCode.None,
      buildId: 'expired-build',
    };
    fetchOneMock.mockResolvedValue(release);
    isReleasePublishedMock.mockResolvedValue(false);

    const { runQueueCli } = await import('../src/queueCli.js');

    await expect(
      runQueueCli([
        'node',
        'index.js',
        'queue-cli',
        'release-reconcile-published',
        'com.foo.bar',
        '1.2.3',
        '--json',
      ]),
    ).rejects.toThrow(
      'Release is not published in the registry: com.foo.bar@1.2.3',
    );

    expect(queueRemoveMock).not.toHaveBeenCalled();
    expect(markReleasePublishedMock).not.toHaveBeenCalled();
  });

  it('release-reconcile-published refuses a release outside Building state', async () => {
    fetchOneMock.mockResolvedValue({
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Pending,
      reason: ReleaseErrorCode.None,
      buildId: '',
    });

    const { runQueueCli } = await import('../src/queueCli.js');

    await expect(
      runQueueCli([
        'node',
        'index.js',
        'queue-cli',
        'release-reconcile-published',
        'com.foo.bar',
        '1.2.3',
        '--json',
      ]),
    ).rejects.toThrow(
      'Release must be Building or already reconciled to retry cleanup: com.foo.bar@1.2.3',
    );

    expect(isReleasePublishedMock).not.toHaveBeenCalled();
    expect(queueRemoveMock).not.toHaveBeenCalled();
    expect(markReleasePublishedMock).not.toHaveBeenCalled();
  });

  it('release-reconcile-published refuses a non-failed release job', async () => {
    fetchOneMock.mockResolvedValue({
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Building,
      reason: ReleaseErrorCode.None,
      buildId: '12345',
    });
    getQueueMock.mockReturnValue({
      remove: queueRemoveMock,
      add: queueAddMock,
      getJob: vi.fn().mockResolvedValue({
        getState: vi.fn().mockResolvedValue('active'),
      }),
    });

    const { runQueueCli } = await import('../src/queueCli.js');

    await expect(
      runQueueCli([
        'node',
        'index.js',
        'queue-cli',
        'release-reconcile-published',
        'com.foo.bar',
        '1.2.3',
        '--json',
      ]),
    ).rejects.toThrow(
      'Release job must be failed to reconcile: com.foo.bar@1.2.3',
    );

    expect(isReleasePublishedMock).not.toHaveBeenCalled();
    expect(queueRemoveMock).not.toHaveBeenCalled();
    expect(markReleasePublishedMock).not.toHaveBeenCalled();
  });

  it('release-reconcile-published leaves verified success when job removal races', async () => {
    fetchOneMock.mockResolvedValue({
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Building,
      reason: ReleaseErrorCode.None,
      buildId: '12345',
    });
    queueRemoveMock.mockResolvedValue(0);

    const { runQueueCli } = await import('../src/queueCli.js');

    await expect(
      runQueueCli([
        'node',
        'index.js',
        'queue-cli',
        'release-reconcile-published',
        'com.foo.bar',
        '1.2.3',
        '--json',
      ]),
    ).rejects.toThrow(
      'Release job could not be removed safely: com.foo.bar@1.2.3',
    );

    expect(isReleasePublishedMock).toHaveBeenCalledWith('com.foo.bar', '1.2.3');
    expect(markReleasePublishedMock).toHaveBeenCalledOnce();
  });

  it('release-reconcile-published retries cleanup for an already reconciled release', async () => {
    const release = {
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      buildId: '',
      signed: false,
      publishedVersion: '1.2.3',
      githubReleaseAssetMissingFirstSeenAt: undefined,
      githubReleaseAssetMissingLastProbeAt: undefined,
      githubReleaseAssetMissingProbeCount: undefined,
    };
    fetchOneMock.mockResolvedValue(release);
    markReleasePublishedMock.mockResolvedValue(release);

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-reconcile-published',
      'com.foo.bar',
      '1.2.3',
      '--json',
    ]);

    expect(isReleasePublishedMock).toHaveBeenCalledWith('com.foo.bar', '1.2.3');
    expect(markReleasePublishedMock).toHaveBeenCalledOnce();
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.foo.bar|1.2.3',
      { removeChildren: true },
    );
  });

  it('release-reconcile-published accepts an already completed cleanup', async () => {
    const release = {
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      buildId: '',
      signed: false,
      publishedVersion: '1.2.3',
      githubReleaseAssetMissingFirstSeenAt: undefined,
      githubReleaseAssetMissingLastProbeAt: undefined,
      githubReleaseAssetMissingProbeCount: undefined,
    };
    fetchOneMock.mockResolvedValue(release);
    markReleasePublishedMock.mockResolvedValue(release);
    getQueueMock.mockReturnValue({
      remove: queueRemoveMock,
      add: queueAddMock,
      getJob: vi.fn().mockResolvedValue(null),
    });

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-reconcile-published',
      'com.foo.bar',
      '1.2.3',
      '--json',
    ]);

    expect(markReleasePublishedMock).toHaveBeenCalledWith(release);
    expect(queueRemoveMock).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"alreadyComplete": true'),
    );
  });

  it('release-reconcile-published keeps the failed job when saving success fails', async () => {
    const release = {
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Building,
      reason: ReleaseErrorCode.None,
      buildId: '12345',
    };
    fetchOneMock.mockResolvedValue(release);
    markReleasePublishedMock.mockRejectedValue(new Error('redis write failed'));

    const { runQueueCli } = await import('../src/queueCli.js');

    await expect(
      runQueueCli([
        'node',
        'index.js',
        'queue-cli',
        'release-reconcile-published',
        'com.foo.bar',
        '1.2.3',
        '--json',
      ]),
    ).rejects.toThrow('redis write failed');

    expect(markReleasePublishedMock).toHaveBeenCalledWith(release);
    expect(queueRemoveMock).not.toHaveBeenCalled();
  });

  it('release-show includes release metadata fields in json output', async () => {
    fetchOneMock.mockResolvedValue({
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      buildId: '12345',
      tag: '1.2.3',
      commit: 'abc123',
      createdAt: 100,
      updatedAt: 200,
      source: 'githubRelease',
      signed: true,
      publishedVersion: '1.2.3-signed',
      githubReleaseAssetMissingFirstSeenAt: 150,
      githubReleaseAssetMissingLastProbeAt: 190,
      githubReleaseAssetMissingProbeCount: 2,
    });

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-show',
      'com.foo.bar',
      '1.2.3',
      '--json',
    ]);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"source": "githubRelease"'),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"signed": true'),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"publishedVersion": "1.2.3-signed"'),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"githubReleaseAssetMissingProbeCount": 2'),
    );
  });

  it('release-show includes release metadata fields in text output', async () => {
    fetchOneMock.mockResolvedValue({
      packageName: 'com.foo.bar',
      version: '1.2.3',
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      buildId: '',
      tag: '1.2.3',
      commit: 'abc123',
      createdAt: 100,
      updatedAt: 200,
      source: 'githubRelease',
      signed: false,
      publishedVersion: '1.2.3',
      githubReleaseAssetMissingFirstSeenAt: 150,
      githubReleaseAssetMissingLastProbeAt: 190,
      githubReleaseAssetMissingProbeCount: 2,
    });

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-show',
      'com.foo.bar',
      '1.2.3',
    ]);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('publishedVersion: 1.2.3'),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('githubReleaseAssetMissingProbeCount: 2'),
    );
  });

  it('cleanup-missing-packages removes failed state for missing packages only', async () => {
    const getJobCountsMock = vi.fn().mockResolvedValue({ failed: 2 });
    const getJobsMock = vi.fn().mockResolvedValue([
      {
        id: 'build-pkg|com.removed.package',
        data: { name: 'com.removed.package' },
      },
      {
        id: 'build-pkg|com.kept.package',
        data: { name: 'com.kept.package' },
      },
    ]);
    getQueueMock.mockImplementation((name: string) => {
      if (name === 'pkg') {
        return {
          remove: queueRemoveMock,
          add: queueAddMock,
          getJobCounts: getJobCountsMock,
          getJobs: getJobsMock,
        };
      }
      return {
        remove: queueRemoveMock,
        add: queueAddMock,
      };
    });
    packageMetadataLocalExistsMock.mockImplementation(
      (name: string) => name === 'com.kept.package',
    );
    fetchAllMock.mockResolvedValue([
      {
        packageName: 'com.removed.package',
        version: '1.0.0',
        state: ReleaseState.Failed,
        reason: ReleaseErrorCode.BuildTimeout,
        buildId: '',
        tag: '1.0.0',
        commit: 'abc',
        updatedAt: 100,
      },
      {
        packageName: 'com.removed.package',
        version: '2.0.0',
        state: ReleaseState.Succeeded,
        reason: ReleaseErrorCode.None,
        buildId: '123',
        tag: '2.0.0',
        commit: 'def',
        updatedAt: 200,
      },
    ]);

    const { runQueueCli } = await import('../src/queueCli.js');

    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'cleanup-missing-packages',
      '--json',
    ]);

    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-pkg|com.removed.package',
      {
        removeChildren: true,
      },
    );
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.removed.package|1.0.0',
      {
        removeChildren: true,
      },
    );
    expect(removeReleaseRecordMock).toHaveBeenCalledWith(
      'com.removed.package',
      '1.0.0',
    );
    expect(removeReleaseRecordMock).not.toHaveBeenCalledWith(
      'com.removed.package',
      '2.0.0',
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"packageName": "com.removed.package"'),
    );
  });
});
