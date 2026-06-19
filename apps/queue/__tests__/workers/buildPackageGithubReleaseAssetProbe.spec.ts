import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReleaseErrorCode, ReleaseState, type ReleaseModel } from '@openupm/types';

const loadPackageMetadataLocalMock = vi.fn();
const packageMetadataLocalExistsMock = vi.fn();
const gitListRemoteTagsMock = vi.fn();
const fetchAllMock = vi.fn();
const fetchOneMock = vi.fn();
const saveReleaseMock = vi.fn();
const removeReleaseMock = vi.fn();
const addJobMock = vi.fn();
const getQueueMock = vi.fn();
const queueGetJobMock = vi.fn();
const queueRemoveMock = vi.fn();
const resolveGitHubReleaseAssetMock = vi.fn();
const setInvalidTagsMock = vi.fn();
const setRepoUnavailableMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  fetchAll: fetchAllMock,
  fetchOne: fetchOneMock,
  remove: removeReleaseMock,
  save: saveReleaseMock,
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  setInvalidTags: setInvalidTagsMock,
  setRepoUnavailable: setRepoUnavailableMock,
}));

vi.mock('../../src/queues/core.js', () => ({
  addJob: addJobMock,
  getQueue: getQueueMock,
}));

vi.mock('../../src/utils/git.js', () => ({
  gitListRemoteTags: gitListRemoteTagsMock,
}));

vi.mock('../../src/utils/githubReleaseAsset.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/utils/githubReleaseAsset.js')
  >('../../src/utils/githubReleaseAsset.js');
  return {
    ...actual,
    resolveGitHubReleaseAsset: resolveGitHubReleaseAssetMock,
  };
});

function createRelease(
  overrides: Partial<ReleaseModel> = {},
): ReleaseModel {
  return {
    packageName: 'com.example.asset',
    version: '1.0.0',
    commit: 'abc123',
    tag: 'upm/1.0.0',
    state: ReleaseState.Failed,
    buildId: 'build-123',
    reason: ReleaseErrorCode.GitHubReleaseAssetNotFound,
    createdAt: Date.parse('2026-05-01T00:00:00.000Z'),
    updatedAt: Date.parse('2026-05-10T00:00:00.000Z'),
    source: 'githubRelease',
    signed: false,
    githubReleaseAssetMissingFirstSeenAt: Date.parse(
      '2026-05-10T00:00:00.000Z',
    ),
    ...overrides,
  };
}

async function runBuildPackage(release: ReleaseModel): Promise<void> {
  fetchAllMock.mockResolvedValue([release]);
  fetchOneMock.mockResolvedValue(release);
  const { buildPackage } = await import('../../src/workers/buildPackage.js');
  await buildPackage('com.example.asset');
}

describe('buildPackage GitHub Release pending probes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(
      Date.parse('2026-05-10T07:00:00.000Z'),
    );
    loadPackageMetadataLocalMock.mockResolvedValue({
      name: 'com.example.asset',
      repoUrl: 'https://github.com/example/asset',
      trackingMode: 'githubRelease',
      githubReleaseAssetName: 'com.example.asset-',
    });
    packageMetadataLocalExistsMock.mockReturnValue(true);
    gitListRemoteTagsMock.mockResolvedValue([
      { tag: 'upm/1.0.0', commit: 'abc123' },
    ]);
    saveReleaseMock.mockImplementation(async (value) => ({
      ...value,
      updatedAt: Date.now(),
    }));
    getQueueMock.mockReturnValue({
      getJob: queueGetJobMock,
      remove: queueRemoveMock,
    });
    queueGetJobMock.mockResolvedValue({
      attemptsMade: 3,
      opts: { attempts: 3 },
      getState: vi.fn(async () => 'failed'),
    });
    queueRemoveMock.mockResolvedValue(1);
    addJobMock.mockResolvedValue({ id: 'build-rel|com.example.asset|1.0.0' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computes early probe intervals and caps at six hours', async () => {
    const { getGitHubReleasePendingProbeIntervalMs } = await import(
      '../../src/workers/buildPackage.js'
    );

    expect(getGitHubReleasePendingProbeIntervalMs(0)).toEqual(10 * 60 * 1000);
    expect(getGitHubReleasePendingProbeIntervalMs(1)).toEqual(20 * 60 * 1000);
    expect(getGitHubReleasePendingProbeIntervalMs(2)).toEqual(40 * 60 * 1000);
    expect(getGitHubReleasePendingProbeIntervalMs(6)).toEqual(6 * 60 * 60 * 1000);
    expect(getGitHubReleasePendingProbeIntervalMs(20)).toEqual(6 * 60 * 60 * 1000);
  });

  it('skips the first probe before the ten minute interval elapses', async () => {
    await runBuildPackage(
      createRelease({
        githubReleaseAssetMissingFirstSeenAt: Date.parse(
          '2026-05-10T06:55:00.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
  });

  it('skips probes before the capped six hour interval elapses', async () => {
    await runBuildPackage(
      createRelease({
        githubReleaseAssetMissingProbeCount: 6,
        githubReleaseAssetMissingLastProbeAt: Date.parse(
          '2026-05-10T02:00:00.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
  });

  it('removes retained failed jobs after the three day first-seen window expires', async () => {
    await runBuildPackage(
      createRelease({
        githubReleaseAssetMissingFirstSeenAt: Date.parse(
          '2026-05-07T06:59:59.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
    expect(removeReleaseMock).not.toHaveBeenCalled();
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.example.asset|1.0.0',
      { removeChildren: true },
    );
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('does not probe non-target release errors', async () => {
    await runBuildPackage(
      createRelease({
        reason: ReleaseErrorCode.GitHubReleaseApiError,
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
  });

  it('keeps missing GitHub Release failures gated by the probe interval', async () => {
    await runBuildPackage(
      createRelease({
        reason: ReleaseErrorCode.GitHubReleaseNotFound,
        githubReleaseAssetMissingFirstSeenAt: Date.parse(
          '2026-05-10T06:55:00.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
    expect(removeReleaseMock).not.toHaveBeenCalled();
    expect(queueRemoveMock).not.toHaveBeenCalled();
    expect(addJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'build-rel',
        data: { name: 'com.example.asset', version: '1.0.0' },
      }),
    );
  });

  it('removes a retained failed release job when its Git tag was deleted', async () => {
    const deletedRelease = createRelease({
      reason: ReleaseErrorCode.GitHubReleaseNotFound,
    });
    gitListRemoteTagsMock.mockResolvedValue([
      { tag: 'upm/1.0.1', commit: 'def456' },
    ]);
    fetchAllMock.mockResolvedValue([deletedRelease]);
    fetchOneMock.mockResolvedValue(null);
    saveReleaseMock.mockImplementation(async (value) => ({
      packageName: 'com.example.asset',
      version: '1.0.1',
      commit: 'def456',
      tag: 'upm/1.0.1',
      state: ReleaseState.Pending,
      buildId: '',
      reason: ReleaseErrorCode.None,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'githubRelease',
      signed: false,
      ...value,
    }));

    const { buildPackage } = await import('../../src/workers/buildPackage.js');
    await buildPackage('com.example.asset');

    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.example.asset|1.0.0',
      { removeChildren: true },
    );
    expect(removeReleaseMock).toHaveBeenCalledWith(
      'com.example.asset',
      '1.0.0',
    );
    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ releaseTag: 'upm/1.0.0' }),
    );
  });

  it('removes a retained failed release job when its only valid Git tag was deleted', async () => {
    const deletedRelease = createRelease({
      reason: ReleaseErrorCode.GitHubReleaseNotFound,
    });
    gitListRemoteTagsMock.mockResolvedValue([]);
    fetchAllMock.mockResolvedValue([deletedRelease]);

    const { buildPackage } = await import('../../src/workers/buildPackage.js');
    await buildPackage('com.example.asset');

    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.example.asset|1.0.0',
      { removeChildren: true },
    );
    expect(removeReleaseMock).toHaveBeenCalledWith(
      'com.example.asset',
      '1.0.0',
    );
    expect(fetchOneMock).not.toHaveBeenCalled();
    expect(addJobMock).not.toHaveBeenCalled();
  });

  it('keeps retryable failed releases retained until explicit reset', async () => {
    await runBuildPackage(
      createRelease({
        reason: ReleaseErrorCode.BuildTimeout,
        githubReleaseAssetMissingFirstSeenAt: undefined,
        githubReleaseAssetMissingLastProbeAt: undefined,
        githubReleaseAssetMissingProbeCount: undefined,
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
    expect(queueRemoveMock).not.toHaveBeenCalled();
    expect(addJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'build-rel',
        data: { name: 'com.example.asset', version: '1.0.0' },
      }),
    );
  });

  it('probes missing GitHub Releases after the early interval elapses', async () => {
    const { GitHubReleaseAssetError } = await import(
      '../../src/utils/githubReleaseAsset.js'
    );
    resolveGitHubReleaseAssetMock.mockRejectedValue(
      new GitHubReleaseAssetError(
        'GitHub Release not found',
        ReleaseErrorCode.GitHubReleaseNotFound,
      ),
    );

    await runBuildPackage(
      createRelease({
        reason: ReleaseErrorCode.GitHubReleaseNotFound,
        githubReleaseAssetMissingFirstSeenAt: Date.parse(
          '2026-05-10T06:49:00.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).toHaveBeenCalled();
    expect(saveReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: ReleaseErrorCode.GitHubReleaseNotFound,
        githubReleaseAssetMissingLastProbeAt: Date.parse(
          '2026-05-10T07:00:00.000Z',
        ),
        githubReleaseAssetMissingProbeCount: 1,
      }),
    );
  });

  it('preserves the missing-asset probe for transient GitHub API errors', async () => {
    const { GitHubReleaseAssetError } = await import(
      '../../src/utils/githubReleaseAsset.js'
    );
    resolveGitHubReleaseAssetMock.mockRejectedValue(
      new GitHubReleaseAssetError(
        'GitHub Release API failed',
        ReleaseErrorCode.GitHubReleaseApiError,
      ),
    );

    await expect(
      runBuildPackage(
        createRelease({
          githubReleaseAssetMissingFirstSeenAt: Date.parse(
            '2026-05-10T06:49:00.000Z',
          ),
        }),
      ),
    ).resolves.toBeUndefined();

    expect(saveReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: ReleaseErrorCode.GitHubReleaseAssetNotFound,
        githubReleaseAssetMissingLastProbeAt: Date.parse(
          '2026-05-10T07:00:00.000Z',
        ),
        githubReleaseAssetMissingProbeCount: 1,
      }),
    );
  });

  it('persists actionable non-transient GitHub Release resolver errors', async () => {
    const { GitHubReleaseAssetError } = await import(
      '../../src/utils/githubReleaseAsset.js'
    );
    resolveGitHubReleaseAssetMock.mockRejectedValue(
      new GitHubReleaseAssetError(
        'GitHub Release asset selection was ambiguous',
        ReleaseErrorCode.GitHubReleaseAssetAmbiguous,
      ),
    );

    await expect(
      runBuildPackage(
        createRelease({
          githubReleaseAssetMissingFirstSeenAt: Date.parse(
            '2026-05-10T06:49:00.000Z',
          ),
        }),
      ),
    ).resolves.toBeUndefined();

    expect(saveReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: ReleaseErrorCode.GitHubReleaseAssetAmbiguous,
        githubReleaseAssetMissingFirstSeenAt: undefined,
        githubReleaseAssetMissingLastProbeAt: undefined,
        githubReleaseAssetMissingProbeCount: undefined,
      }),
    );
  });

  it('persists probe backoff when the asset is still missing', async () => {
    const { GitHubReleaseAssetError } = await import(
      '../../src/utils/githubReleaseAsset.js'
    );
    resolveGitHubReleaseAssetMock.mockRejectedValue(
      new GitHubReleaseAssetError(
        'GitHub Release asset not found',
        ReleaseErrorCode.GitHubReleaseAssetNotFound,
      ),
    );

    await runBuildPackage(
      createRelease({
        githubReleaseAssetMissingLastProbeAt: Date.parse(
          '2026-05-10T06:19:00.000Z',
        ),
        githubReleaseAssetMissingProbeCount: 2,
      }),
    );

    expect(saveReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: ReleaseErrorCode.GitHubReleaseAssetNotFound,
        githubReleaseAssetMissingLastProbeAt: Date.parse(
          '2026-05-10T07:00:00.000Z',
        ),
        githubReleaseAssetMissingProbeCount: 3,
      }),
    );
  });

  it('resets an exhausted release and enqueues a fresh job when the asset appears', async () => {
    const release = createRelease({
      githubReleaseAssetMissingLastProbeAt: Date.parse(
        '2026-05-10T06:39:00.000Z',
      ),
      githubReleaseAssetMissingProbeCount: 1,
    });
    resolveGitHubReleaseAssetMock.mockResolvedValue({
      packageAssetName: 'com.example.asset-1.0.0.tgz',
      packageAssetUrl: 'https://example.invalid/asset.tgz',
    });

    await runBuildPackage(release);

    expect(resolveGitHubReleaseAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: 'https://github.com/example/asset',
        releaseTag: 'upm/1.0.0',
        githubReleaseAssetName: 'com.example.asset-',
      }),
    );
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.example.asset|1.0.0',
      { removeChildren: true },
    );
    expect(saveReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        packageName: 'com.example.asset',
        version: '1.0.0',
        state: ReleaseState.Pending,
        reason: ReleaseErrorCode.None,
        buildId: '',
      }),
    );
    expect(addJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'build-rel',
        data: { name: 'com.example.asset', version: '1.0.0' },
        opts: expect.objectContaining({
          jobId: 'build-rel|com.example.asset|1.0.0',
        }),
      }),
    );
  });

  it('removes a retained exhausted failed job before enqueueing a pending release', async () => {
    await runBuildPackage(
      createRelease({
        state: ReleaseState.Pending,
        reason: ReleaseErrorCode.None,
        buildId: '',
        githubReleaseAssetMissingFirstSeenAt: undefined,
        githubReleaseAssetMissingLastProbeAt: undefined,
        githubReleaseAssetMissingProbeCount: undefined,
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
    expect(queueGetJobMock).toHaveBeenCalledWith(
      'build-rel|com.example.asset|1.0.0',
    );
    expect(queueRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.example.asset|1.0.0',
      { removeChildren: true },
    );
    expect(addJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'build-rel',
        data: { name: 'com.example.asset', version: '1.0.0' },
        opts: expect.objectContaining({
          jobId: 'build-rel|com.example.asset|1.0.0',
        }),
      }),
    );
  });
});
