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

describe('queue-cli destructive actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    getQueueMock.mockReturnValue({
      remove: queueRemoveMock,
      add: queueAddMock,
      getJobCounts: vi.fn().mockResolvedValue({ failed: 0 }),
      getJobs: vi.fn().mockResolvedValue([]),
    });
    hasQueueMock.mockImplementation((name: string) => name === 'pkg' || name === 'rel');
    queueRemoveMock.mockResolvedValue(1);
    packageMetadataLocalExistsMock.mockReturnValue(true);
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
    expect(queueRemoveMock).toHaveBeenCalledWith('build-rel|com.foo.bar|1.2.3', {
      removeChildren: true,
    });
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
    expect(queueRemoveMock).toHaveBeenCalledWith('build-rel|com.foo.bar|1.2.3', {
      removeChildren: true,
    });
    expect(removeReleaseRecordMock).toHaveBeenCalledWith('com.foo.bar', '1.2.3');
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
    expect(queueRemoveMock).toHaveBeenCalledWith('build-rel|com.foo.bar|1.2.3', {
      removeChildren: true,
    });
    expect(saveReleaseMock).toHaveBeenCalledWith({
      ...release,
      state: ReleaseState.Pending,
      reason: ReleaseErrorCode.None,
      buildId: '',
    });
    expect(addJobMock).toHaveBeenCalledWith({
      queue: expect.anything(),
      name: 'build-rel',
      data: { name: 'com.foo.bar', version: '1.2.3' },
      opts: { jobId: 'build-rel|com.foo.bar|1.2.3' },
    });
    expect(removeReleaseRecordMock).not.toHaveBeenCalled();
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
