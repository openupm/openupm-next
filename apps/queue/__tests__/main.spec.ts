import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchMock = vi.fn();
const getPackageNamesFromArgsMock = vi.fn();
const addBuildPackageJobsMock = vi.fn();
const cronJobMock = vi.fn();
const pingHealthcheckMock = vi.fn();
const runQueueCliMock = vi.fn();
const runQueueHealthcheckMock = vi.fn();

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

vi.mock('../src/queueCli.js', () => ({
  runQueueCli: runQueueCliMock,
}));

vi.mock('../src/queues/health.js', () => ({
  runQueueHealthcheck: runQueueHealthcheckMock,
}));

describe('main', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
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

  it('dispatches queue-cli command', async () => {
    process.argv = ['node', 'index.js', 'queue-cli', 'queue-status'];

    const { main } = await import('../src/index.js');
    await main();

    expect(runQueueCliMock).toHaveBeenCalledWith(process.argv);
  });

  it('prints queue-cli errors as human-readable stderr', async () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    process.argv = ['node', 'index.js', 'queue-cli', 'cmd-not-exist'];
    runQueueCliMock.mockRejectedValue(new Error('queue-cli usage text'));

    const { main } = await import('../src/index.js');
    await main();

    expect(errorSpy).toHaveBeenCalledWith('queue-cli usage text');
    expect(process.exitCode).toBe(1);
    errorSpy.mockRestore();
  });

  it('runs queue healthcheck command', async () => {
    process.argv = ['node', 'index.js', 'health', 'pkg'];

    const { main } = await import('../src/index.js');
    await main();

    expect(runQueueHealthcheckMock).toHaveBeenCalledWith(['pkg']);
  });

  it('prints help without starting services', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.argv = ['node', 'index.js', '--help'];

    const { main } = await import('../src/index.js');
    await main();

    expect(logSpy.mock.calls[0][0]).toContain('OpenUPM queue service command.');
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(runQueueCliMock).not.toHaveBeenCalled();
    expect(runQueueHealthcheckMock).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
