import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchMock = vi.fn();
const getPackageNamesFromArgsMock = vi.fn();
const addBuildPackageJobsMock = vi.fn();

vi.mock('../src/queues/process.js', () => ({
  dispatch: dispatchMock,
}));

vi.mock('../src/jobs/addBuildPackageJob.js', () => ({
  getPackageNamesFromArgs: getPackageNamesFromArgsMock,
  addBuildPackageJobs: addBuildPackageJobsMock,
}));

describe('main', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('dispatches process command', async () => {
    process.argv = ['node', 'index.js', 'process', 'pkg'];
    const { main } = await import('../src/index.js');
    await main();
    expect(dispatchMock).toHaveBeenCalledWith('pkg');
  });

  it('adds build package jobs from resolved package names', async () => {
    process.argv = ['node', 'index.js', 'add-build-package-job', '--all'];
    getPackageNamesFromArgsMock.mockResolvedValue(['com.a.one']);

    const { main } = await import('../src/index.js');
    await main();

    expect(getPackageNamesFromArgsMock).toHaveBeenCalledWith({
      all: true,
      names: [],
    });
    expect(addBuildPackageJobsMock).toHaveBeenCalledWith(['com.a.one']);
  });

  it('throws when add-build-package-job has no package names', async () => {
    process.argv = ['node', 'index.js', 'add-build-package-job'];
    getPackageNamesFromArgsMock.mockResolvedValue([]);

    const { main } = await import('../src/index.js');
    await expect(main()).rejects.toThrow(
      'No package names provided. Use --all or pass names.',
    );
  });
});
