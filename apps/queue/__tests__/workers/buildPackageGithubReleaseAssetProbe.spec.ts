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

describe('buildPackage GitHub Release asset missing probes', () => {
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

  it('skips probes before the six hour interval elapses', async () => {
    await runBuildPackage(
      createRelease({
        githubReleaseAssetMissingLastProbeAt: Date.parse(
          '2026-05-10T02:00:00.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
  });

  it('stops probing after the seven day first-seen window', async () => {
    await runBuildPackage(
      createRelease({
        githubReleaseAssetMissingFirstSeenAt: Date.parse(
          '2026-05-02T06:59:59.000Z',
        ),
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
  });

  it('does not probe non-target release errors', async () => {
    await runBuildPackage(
      createRelease({
        reason: ReleaseErrorCode.GitHubReleaseApiError,
      }),
    );

    expect(resolveGitHubReleaseAssetMock).not.toHaveBeenCalled();
  });

  it('ignores non-target GitHub Release resolver errors during probes', async () => {
    const { GitHubReleaseAssetError } = await import(
      '../../src/utils/githubReleaseAsset.js'
    );
    resolveGitHubReleaseAssetMock.mockRejectedValue(
      new GitHubReleaseAssetError(
        'GitHub Release API failed',
        ReleaseErrorCode.GitHubReleaseApiError,
      ),
    );

    await expect(runBuildPackage(createRelease())).resolves.toBeUndefined();

    expect(saveReleaseMock).not.toHaveBeenCalled();
  });

  it('resets an exhausted release and enqueues a fresh job when the asset appears', async () => {
    const release = createRelease({
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
});
