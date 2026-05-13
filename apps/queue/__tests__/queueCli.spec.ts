import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getJobCountsMock,
  getJobsMock,
  getWorkersMock,
  hasQueueMock,
  fetchAllMock,
  backfillRecentReleaseIndexesMock,
  redisScanMock,
} = vi.hoisted(() => ({
  getJobCountsMock: vi.fn(),
  getJobsMock: vi.fn(),
  getWorkersMock: vi.fn(),
  hasQueueMock: vi.fn((name: string) => name === 'pkg' || name === 'rel'),
  fetchAllMock: vi.fn(),
  backfillRecentReleaseIndexesMock: vi.fn(),
  redisScanMock: vi.fn(),
}));

vi.mock('../src/queues/core.js', () => ({
  addJob: vi.fn(),
  closeQueues: vi.fn(),
  getQueue: vi.fn(() => ({
    getJobCounts: getJobCountsMock,
    getJobs: getJobsMock,
    getWorkers: getWorkersMock,
  })),
  hasQueue: hasQueueMock,
}));

vi.mock('@openupm/server-common/build/redis.js', () => ({
  default: {
    close: vi.fn(),
    client: {
      scan: redisScanMock,
    },
  },
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  backfillRecentReleaseIndexes: backfillRecentReleaseIndexesMock,
  fetchAll: fetchAllMock,
  fetchOne: vi.fn(),
  remove: vi.fn(),
  save: vi.fn(),
}));

describe('parseQueueCliArgs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasQueueMock.mockImplementation(
      (name: string) => name === 'pkg' || name === 'rel',
    );
    fetchAllMock.mockReset();
    backfillRecentReleaseIndexesMock.mockReset();
    redisScanMock.mockReset();
  });

  it('parses json and limit flags', async () => {
    const { parseQueueCliArgs } = await import('../src/queueCli.js');
    const parsed = parseQueueCliArgs([
      'node',
      'index.js',
      'queue-cli',
      'releases-failed',
      'timeout',
      '--limit',
      '10',
      '--json',
    ]);

    expect(parsed).toEqual({
      command: 'releases-failed',
      rest: ['timeout'],
      output: 'json',
      limit: 10,
    });
  });

  it('keeps the first positional command when limit is omitted', async () => {
    const { parseQueueCliArgs } = await import('../src/queueCli.js');
    const parsed = parseQueueCliArgs([
      'node',
      'index.js',
      'queue-cli',
      'queue-status',
      'rel',
    ]);

    expect(parsed).toEqual({
      command: 'queue-status',
      rest: ['rel'],
      output: 'text',
      limit: undefined,
    });
  });

  it('parses top-level help', async () => {
    const { parseQueueCliArgs } = await import('../src/queueCli.js');
    const parsed = parseQueueCliArgs(['node', 'index.js', 'queue-cli', '--help']);
    expect(parsed).toEqual({ command: 'help' });
  });

  it('parses subcommand help', async () => {
    const { parseQueueCliArgs } = await import('../src/queueCli.js');
    const parsed = parseQueueCliArgs([
      'node',
      'index.js',
      'queue-cli',
      'queue-jobs',
      '--help',
    ]);
    expect(parsed).toEqual({ command: 'help', topic: 'queue-jobs' });
  });

  it('documents the full queue-jobs interface', async () => {
    const { getCommandUsage } = await import('../src/queueCli.js');
    const help = getCommandUsage('queue-jobs');
    expect(help).toContain('queue-cli queue-jobs <queue> [state...]');
    expect(help).toContain('Default: failed active waiting.');
    expect(help).toContain('Default: all matching jobs.');
    expect(help).toContain('waiting, active, delayed, failed');
  });

  it('documents the full releases-failed interface', async () => {
    const { getCommandUsage } = await import('../src/queueCli.js');
    const help = getCommandUsage('releases-failed');
    expect(help).toContain('queue-cli releases-failed [reason|unknown|timeout]');
    expect(help).toContain('BuildTimeout/ConnectionTimeout/GatewayTimeout');
    expect(help).toContain('VersionConflict');
  });

  it('documents the release index backfill command', async () => {
    const { getCommandUsage, getUsage } = await import('../src/queueCli.js');
    expect(getUsage()).toContain('release-index-backfill');
    const help = getCommandUsage('release-index-backfill');
    expect(help).toContain('queue-cli release-index-backfill');
    expect(help).toContain('Rebuild the bounded recent succeeded/failed');
  });

  it('documents destructive commands in top-level help', async () => {
    const { getUsage } = await import('../src/queueCli.js');
    const help = getUsage();
    expect(help).toContain('remove-job <queue> <jobId>');
    expect(help).toContain('This is destructive');
    expect(help).toContain('release-remove <package> <version>');
    expect(help).toContain('cleanup-missing-packages');
  });

  it('documents cleanup-missing-packages behavior', async () => {
    const { getCommandUsage } = await import('../src/queueCli.js');
    const help = getCommandUsage('cleanup-missing-packages');
    expect(help).toContain('queue-cli cleanup-missing-packages');
    expect(help).toContain('Successful and non-failed release records are preserved.');
  });

  it('queue-jobs includes total and limit metadata', async () => {
    const { queueJobs } = await import('../src/queueCli.js');
    getJobCountsMock.mockResolvedValue({ failed: 182 });
    getJobsMock.mockResolvedValue([
      {
        id: 'build-pkg|com.foo.bar',
        name: 'build-pkg',
        attemptsMade: 3,
        timestamp: 100,
        data: { name: 'com.foo.bar' },
        getState: vi.fn().mockResolvedValue('failed'),
      },
    ]);

    const result = await queueJobs('pkg', ['failed'], 20);

    expect(result).toMatchObject({
      queue: 'pkg',
      states: ['failed'],
      total: 182,
      limit: 20,
      returned: 1,
    });
    expect(result.jobs[0].id).toBe('build-pkg|com.foo.bar');
  });

  it('queue-jobs returns all matching jobs when limit is omitted', async () => {
    const { queueJobs } = await import('../src/queueCli.js');
    getJobCountsMock.mockResolvedValue({ failed: 182 });
    getJobsMock.mockResolvedValue([]);

    const result = await queueJobs('pkg', ['failed']);

    expect(getJobsMock).toHaveBeenCalledWith(['failed'], 0, 181, false);
    expect(result).toMatchObject({
      total: 182,
      limit: 182,
      returned: 0,
    });
  });

  it('queue-status text output is formatted for humans', async () => {
    const { queueStatus } = await import('../src/queueCli.js');
    getJobCountsMock.mockResolvedValue({
      active: 5,
      waiting: 738,
      delayed: 0,
      failed: 182,
      completed: 0,
      paused: 0,
    });
    getWorkersMock.mockResolvedValue([
      { id: '2000', name: 'pkg', cmd: 'bzpopmin', addr: '127.0.0.1:1' },
    ]);

    const result = await queueStatus('pkg');

    expect(result).toEqual([
      {
        queue: 'pkg',
        counts: {
          active: 5,
          waiting: 738,
          delayed: 0,
          failed: 182,
          completed: 0,
          paused: 0,
        },
        workers: [
          { id: '2000', name: 'pkg', cmd: 'bzpopmin', addr: '127.0.0.1:1' },
        ],
      },
    ]);
  });

  it('releases-failed skips derived release index keys while scanning', async () => {
    const { releasesFailed } = await import('../src/queueCli.js');
    redisScanMock.mockResolvedValueOnce([
      '0',
      ['rel:com.failed.package', 'rel:index:succeeded', 'rel:index:failed'],
    ]);
    fetchAllMock.mockResolvedValueOnce([
      {
        packageName: 'com.failed.package',
        version: '1.0.0',
        state: 3,
        reason: 700,
        buildId: '',
        tag: '',
        commit: '',
        updatedAt: 100,
      },
    ]);

    const result = await releasesFailed(undefined, 20);

    expect(fetchAllMock).toHaveBeenCalledTimes(1);
    expect(fetchAllMock).toHaveBeenCalledWith('com.failed.package');
    expect(result).toMatchObject([
      { packageName: 'com.failed.package', version: '1.0.0' },
    ]);
  });

  it('runs release-index-backfill and prints JSON output', async () => {
    backfillRecentReleaseIndexesMock.mockResolvedValue({
      scannedPackages: 10,
      scannedReleases: 40,
      succeeded: 30,
      failed: 2,
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const { runQueueCli } = await import('../src/queueCli.js');
    await runQueueCli([
      'node',
      'index.js',
      'queue-cli',
      'release-index-backfill',
      '--json',
    ]);

    expect(backfillRecentReleaseIndexesMock).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"scannedReleases": 40'),
    );
  });
});
