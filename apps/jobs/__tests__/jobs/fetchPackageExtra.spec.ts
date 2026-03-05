import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageNamesMock = vi.fn();
const packageMetadataLocalExistsMock = vi.fn();
const loadPackageMetadataLocalMock = vi.fn();

const setUnityVersionMock = vi.fn();
const setUpdatedTimeMock = vi.fn();
const setVersionMock = vi.fn();
const setScopesMock = vi.fn();
const setStarsMock = vi.fn();
const setParentStarsMock = vi.fn();
const setRepoPushedTimeMock = vi.fn();
const setRepoUpdatedTimeMock = vi.fn();
const setRepoUnavailableMock = vi.fn();
const setMonthlyDownloadsMock = vi.fn();
const getImageQueryForPackageMock = vi.fn();
const getImageQueryForGithubUserMock = vi.fn();

const getImageMock = vi.fn();
const addImageMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  setUnityVersion: setUnityVersionMock,
  setUpdatedTime: setUpdatedTimeMock,
  setVersion: setVersionMock,
  setScopes: setScopesMock,
  setStars: setStarsMock,
  setParentStars: setParentStarsMock,
  setRepoPushedTime: setRepoPushedTimeMock,
  setRepoUpdatedTime: setRepoUpdatedTimeMock,
  setRepoUnavailable: setRepoUnavailableMock,
  setMonthlyDownloads: setMonthlyDownloadsMock,
  getImageQueryForPackage: getImageQueryForPackageMock,
  getImageQueryForGithubUser: getImageQueryForGithubUserMock,
  getCachedImageFilename: vi.fn().mockResolvedValue(null),
}));

vi.mock('@openupm/server-common/build/utils/media.js', () => ({
  getImage: getImageMock,
  addImage: addImageMock,
}));

describe('fetchPackageExtraJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads all package names when all=true', async () => {
    loadPackageNamesMock.mockResolvedValue(['com.test.pkg']);
    packageMetadataLocalExistsMock.mockReturnValue(true);
    loadPackageMetadataLocalMock.mockResolvedValue({
      repo: 'openupm/openupm',
      owner: 'openupm',
      parentOwner: null,
      hunter: 'openupm',
    });

    getImageQueryForPackageMock.mockResolvedValue(null);
    getImageQueryForGithubUserMock.mockResolvedValue({
      imageUrl: 'https://github.com/openupm.png?size=48',
      width: 48,
      height: 48,
      fit: 'cover',
    });
    getImageMock.mockResolvedValue({ available: true });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { unity: '2021.3', dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stargazers_count: 10 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ downloads: 20 }),
      });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageExtraJob } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageExtraJob(null, { all: true, force: false });

    expect(loadPackageNamesMock).toHaveBeenCalledWith({ sortKey: '-mtime' });
    expect(setVersionMock).toHaveBeenCalledWith('com.test.pkg', '1.0.0');
    expect(setScopesMock).toHaveBeenCalled();
    expect(setStarsMock).toHaveBeenCalledWith('com.test.pkg', 10);
    expect(setMonthlyDownloadsMock).toHaveBeenCalledWith('com.test.pkg', 20);
  });

  it('cacheAvatarImageForGithubUser should add image when cache unavailable', async () => {
    getImageQueryForGithubUserMock.mockResolvedValue({
      imageUrl: 'https://github.com/bob.png?size=48',
      width: 48,
      height: 48,
      fit: 'cover',
    });
    getImageMock.mockResolvedValue(null);

    const { cacheAvatarImageForGithubUser } = await import('../../src/jobs/fetchPackageExtra.js');
    await cacheAvatarImageForGithubUser('bob', false);

    expect(addImageMock).toHaveBeenCalled();
  });
});
