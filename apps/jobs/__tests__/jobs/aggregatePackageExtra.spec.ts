import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageNamesMock = vi.fn();
const loadPackageMetadataLocalMock = vi.fn();
const getStarsMock = vi.fn();
const getParentStarsMock = vi.fn();
const getUnityVersionMock = vi.fn();
const getCachedImageFilenameMock = vi.fn();
const getUpdatedTimeMock = vi.fn();
const getRepoPushedTimeMock = vi.fn();
const getVersionMock = vi.fn();
const getRepoUnavailableMock = vi.fn();
const getMonthlyDownloadsMock = vi.fn();
const setAggregatedExtraDataMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  getStars: getStarsMock,
  getParentStars: getParentStarsMock,
  getUnityVersion: getUnityVersionMock,
  getCachedImageFilename: getCachedImageFilenameMock,
  getUpdatedTime: getUpdatedTimeMock,
  getRepoPushedTime: getRepoPushedTimeMock,
  getVersion: getVersionMock,
  getRepoUnavailable: getRepoUnavailableMock,
  getMonthlyDownloads: getMonthlyDownloadsMock,
  setAggregatedExtraData: setAggregatedExtraDataMock,
}));

describe('aggregatePackageExtraJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should aggregate with defaults', async () => {
    loadPackageNamesMock.mockResolvedValue(['pkg.one']);
    loadPackageMetadataLocalMock.mockResolvedValue({ name: 'pkg.one' });
    getStarsMock.mockResolvedValue(0);
    getParentStarsMock.mockResolvedValue(0);
    getUnityVersionMock.mockResolvedValue('');
    getCachedImageFilenameMock.mockResolvedValue('');
    getUpdatedTimeMock.mockResolvedValue(0);
    getRepoPushedTimeMock.mockResolvedValue(2000);
    getVersionMock.mockResolvedValue('');
    getRepoUnavailableMock.mockResolvedValue(false);
    getMonthlyDownloadsMock.mockResolvedValue(99);

    const { aggregatePackageExtraJob } = await import('../../src/jobs/aggregatePackageExtra.js');
    await aggregatePackageExtraJob();

    expect(setAggregatedExtraDataMock).toHaveBeenCalledWith({
      'pkg.one': {
        stars: 0,
        pstars: undefined,
        unity: '2018.1',
        imageFilename: undefined,
        time: 2000,
        ver: undefined,
        repoUnavailable: undefined,
        dl30d: 99,
      },
    });
  });
});
