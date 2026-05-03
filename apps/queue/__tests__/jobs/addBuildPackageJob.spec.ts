import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageNamesMock = vi.fn();
const packageMetadataLocalExistsMock = vi.fn();
const addJobMock = vi.fn();
const getQueueMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
}));

vi.mock('../../src/queues/core.js', () => ({
  addJob: addJobMock,
  getQueue: getQueueMock,
}));

describe('addBuildPackageJobs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getQueueMock.mockReturnValue({});
  });

  it('adds jobs only for existing packages', async () => {
    packageMetadataLocalExistsMock
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const { addBuildPackageJobs } = await import(
      '../../src/jobs/addBuildPackageJob.js'
    );

    await addBuildPackageJobs(['com.a.one', 'com.a.two']);

    expect(addJobMock).toHaveBeenCalledTimes(1);
    expect(addJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'build-pkg',
        data: { name: 'com.a.one' },
        opts: expect.objectContaining({ jobId: 'build-pkg|com.a.one' }),
      }),
    );
  });

  it('loads package names by mtime for --all', async () => {
    loadPackageNamesMock.mockResolvedValue(['com.a.one']);

    const { getPackageNamesFromArgs } = await import(
      '../../src/jobs/addBuildPackageJob.js'
    );

    const names = await getPackageNamesFromArgs({ all: true, names: [] });
    expect(loadPackageNamesMock).toHaveBeenCalledWith({ sortKey: '-mtime' });
    expect(names).toEqual(['com.a.one']);
  });
});
