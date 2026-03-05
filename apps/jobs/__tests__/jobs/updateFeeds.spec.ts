import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageNamesMock = vi.fn();
const loadPackageMetadataLocalMock = vi.fn();
const getCachedImageFilenameMock = vi.fn();
const getUpdatedTimeMock = vi.fn();
const getVersionMock = vi.fn();
const setFeedRecentUpdateMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  getCachedImageFilename: getCachedImageFilenameMock,
  getUpdatedTime: getUpdatedTimeMock,
  getVersion: getVersionMock,
}));

vi.mock('@openupm/server-common/build/models/packageFeed.js', () => ({
  setFeedRecentUpdate: setFeedRecentUpdateMock,
}));

describe('updateFeedsJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should build and persist feed entries', async () => {
    loadPackageNamesMock.mockResolvedValue(['pkg.one', 'pkg.two']);
    loadPackageMetadataLocalMock.mockImplementation(async (name: string) => {
      if (name === 'pkg.one') {
        return {
          displayName: 'Package One',
          owner: 'alice',
          ownerUrl: 'https://github.com/alice',
          parentRepoUrl: 'https://github.com/org/repo',
          parentOwner: 'org',
          parentOwnerUrl: 'https://github.com/org',
        };
      }
      return {
        displayName: 'Package Two',
        owner: 'bob',
        ownerUrl: 'https://github.com/bob',
      };
    });
    getCachedImageFilenameMock.mockResolvedValueOnce('img.png').mockResolvedValueOnce(null);
    getUpdatedTimeMock.mockResolvedValueOnce(1000).mockResolvedValueOnce(0);
    getVersionMock.mockResolvedValueOnce('1.0.0').mockResolvedValueOnce('2.0.0');

    const { updateFeedsJob } = await import('../../src/jobs/updateFeeds.js');
    await updateFeedsJob();

    expect(setFeedRecentUpdateMock).toHaveBeenCalledTimes(1);
    const payload = setFeedRecentUpdateMock.mock.calls[0][0];
    expect(payload).toEqual([
      {
        packageName: 'pkg.one',
        displayName: 'Package One',
        image: 'https://openupm.sfo2.cdn.digitaloceanspaces.com/media/img.png',
        time: 1000,
        version: '1.0.0',
        author: [
          { name: 'alice', link: 'https://github.com/alice' },
          { name: 'org', link: 'https://github.com/org' },
        ],
      },
    ]);
  });
});
