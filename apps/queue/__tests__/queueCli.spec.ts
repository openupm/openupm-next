import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getJobCountsMock,
  getJobsMock,
  getWorkersMock,
  hasQueueMock,
} = vi.hoisted(() => ({
  getJobCountsMock: vi.fn(),
  getJobsMock: vi.fn(),
  getWorkersMock: vi.fn(),
  hasQueueMock: vi.fn((name: string) => name === 'pkg' || name === 'rel'),
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
      scan: vi.fn(),
    },
  },
}));

describe('parseQueueCliArgs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasQueueMock.mockImplementation(
      (name: string) => name === 'pkg' || name === 'rel',
    );
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
      limit: 20,
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
    expect(help).toContain('waiting, active, delayed, failed');
  });

  it('documents the full releases-failed interface', async () => {
    const { getCommandUsage } = await import('../src/queueCli.js');
    const help = getCommandUsage('releases-failed');
    expect(help).toContain('queue-cli releases-failed [reason|unknown|timeout]');
    expect(help).toContain('BuildTimeout/ConnectionTimeout/GatewayTimeout');
    expect(help).toContain('VersionConflict');
  });

  it('documents destructive commands in top-level help', async () => {
    const { getUsage } = await import('../src/queueCli.js');
    const help = getUsage();
    expect(help).toContain('remove-job <queue> <jobId>');
    expect(help).toContain('This is destructive');
    expect(help).toContain('release-remove <package> <version>');
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
});
