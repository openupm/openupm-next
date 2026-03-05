import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageNamesMock = vi.fn();
const loadPackageMetadataLocalMock = vi.fn();
const getAggregatedExtraDataMock = vi.fn();
const setRecentPackagesMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  getAggregatedExtraData: getAggregatedExtraDataMock,
  setRecentPackages: setRecentPackagesMock,
}));

describe('updateRecentPackagesJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('joins and sorts recent packages', async () => {
    loadPackageNamesMock.mockResolvedValue(['com.a.one', 'com.a.two']);
    loadPackageMetadataLocalMock
      .mockResolvedValueOnce({
        name: 'com.a.one',
        displayName: 'One',
        createdAt: 1,
      })
      .mockResolvedValueOnce({
        name: 'com.a.two',
        displayName: 'Two',
        createdAt: 2,
      });

    getAggregatedExtraDataMock.mockResolvedValue({
      'com.a.one': { time: 10, ver: '1.0.0' },
      'com.a.two': { time: 20, ver: '2.0.0' },
    });

    const { updateRecentPackagesJob } = await import(
      '../../src/jobs/updateRecentPackages.js'
    );

    await updateRecentPackagesJob();

    expect(setRecentPackagesMock).toHaveBeenCalledTimes(1);
    const payload = setRecentPackagesMock.mock.calls[0][0];
    expect(payload).toHaveLength(2);
    expect(payload[0].name).toEqual('com.a.two');
    expect(payload[0].version).toEqual('2.0.0');
  });

  it('joinPackageExtra should mark pending with missing version', async () => {
    const { joinPackageExtra } = await import(
      '../../src/jobs/updateRecentPackages.js'
    );
    const result = joinPackageExtra({ name: 'com.a.one' }, { time: 1 });
    expect(result.pending).toBe(true);
  });
});
