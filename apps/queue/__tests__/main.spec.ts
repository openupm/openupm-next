import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchMock = vi.fn();
const getPackageNamesFromArgsMock = vi.fn();
const addBuildPackageJobsMock = vi.fn();
const cronJobMock = vi.fn();
const pingHealthcheckMock = vi.fn();

vi.mock('cron', () => ({
  CronJob: cronJobMock,
}));

vi.mock('@openupm/server-common/build/healthchecks.js', () => ({
  pingHealthcheck: pingHealthcheckMock,
}));

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

  it('starts add-build-package-job scheduler', async () => {
    process.argv = ['node', 'index.js', 'schedule', 'add-build-package-job'];

    const { main } = await import('../src/index.js');
    await main();

    expect(cronJobMock).toHaveBeenCalledWith(
      '*/5 * * * *',
      expect.any(Function),
      null,
      true,
    );
  });

  it('pings healthchecks around successful scheduled add-build-package-job runs', async () => {
    process.argv = ['node', 'index.js', 'schedule', 'add-build-package-job'];
    getPackageNamesFromArgsMock.mockResolvedValue(['com.a.one']);

    const { main } = await import('../src/index.js');
    await main();
    const onTick = cronJobMock.mock.calls[0][1];
    await onTick();

    expect(pingHealthcheckMock).toHaveBeenNthCalledWith(
      1,
      '',
      'start',
      expect.anything(),
    );
    expect(addBuildPackageJobsMock).toHaveBeenCalledWith(['com.a.one']);
    expect(pingHealthcheckMock).toHaveBeenNthCalledWith(
      2,
      '',
      'success',
      expect.anything(),
    );
  });

  it('pings healthchecks fail when scheduled add-build-package-job throws', async () => {
    process.argv = ['node', 'index.js', 'schedule', 'add-build-package-job'];
    getPackageNamesFromArgsMock.mockRejectedValue(new Error('boom'));

    const { main } = await import('../src/index.js');
    await main();
    const onTick = cronJobMock.mock.calls[0][1];
    await onTick();

    expect(pingHealthcheckMock).toHaveBeenNthCalledWith(
      1,
      '',
      'start',
      expect.anything(),
    );
    expect(pingHealthcheckMock).toHaveBeenNthCalledWith(
      2,
      '',
      'fail',
      expect.anything(),
    );
  });

  it('throws for unknown scheduler job', async () => {
    process.argv = ['node', 'index.js', 'schedule', 'unknown'];

    const { main } = await import('../src/index.js');
    await expect(main()).rejects.toThrow('Unknown schedule job: unknown');
  });
});
