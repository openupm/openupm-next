import { afterEach, describe, expect, it, vi } from 'vitest';

const queueMocks = vi.hoisted(() => ({
  add: vi.fn(),
  close: vi.fn(),
  getJob: vi.fn(),
  queueConstructor: vi.fn(),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation((name, settings) => {
    queueMocks.queueConstructor(name, settings);
    return {
      add: queueMocks.add,
      close: queueMocks.close,
      getJob: queueMocks.getJob,
    };
  }),
}));

const {
  closePackageRefreshQueues,
  enqueuePackageRefresh,
} = await import('../../src/publishTrigger/packageRefresh.js');

describe('packageRefresh', () => {
  afterEach(async () => {
    await closePackageRefreshQueues();
    for (const mock of Object.values(queueMocks)) mock.mockReset();
  });

  it('enqueues a deterministic package refresh job', async () => {
    queueMocks.getJob.mockResolvedValue(null);
    queueMocks.add.mockResolvedValue({ id: 'build-pkg|com.example.foo' });

    const result = await enqueuePackageRefresh('com.example.foo');

    expect(queueMocks.queueConstructor).toHaveBeenCalledWith(
      'pkg',
      expect.objectContaining({
        connection: expect.any(Object),
      }),
    );
    expect(queueMocks.getJob).toHaveBeenCalledWith('build-pkg|com.example.foo');
    expect(queueMocks.add).toHaveBeenCalledWith(
      'build-pkg',
      { name: 'com.example.foo' },
      { jobId: 'build-pkg|com.example.foo' },
    );
    expect(result).toEqual({
      queue: 'pkg',
      jobId: 'build-pkg|com.example.foo',
      added: true,
    });
  });

  it('dedupes an existing package refresh job', async () => {
    queueMocks.getJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('waiting'),
      id: 'build-pkg|com.example.foo',
      remove: vi.fn(),
    });

    const result = await enqueuePackageRefresh('com.example.foo');

    expect(queueMocks.add).not.toHaveBeenCalled();
    expect(result).toEqual({
      queue: 'pkg',
      jobId: 'build-pkg|com.example.foo',
      added: false,
    });
  });

  it('replaces a failed package refresh job', async () => {
    const existing = {
      getState: vi.fn().mockResolvedValue('failed'),
      id: 'build-pkg|com.example.foo',
      remove: vi.fn().mockResolvedValue(undefined),
    };
    queueMocks.getJob.mockResolvedValue(existing);
    queueMocks.add.mockResolvedValue({ id: 'build-pkg|com.example.foo' });

    const result = await enqueuePackageRefresh('com.example.foo');

    expect(existing.remove).toHaveBeenCalled();
    expect(queueMocks.add).toHaveBeenCalledWith(
      'build-pkg',
      { name: 'com.example.foo' },
      { jobId: 'build-pkg|com.example.foo' },
    );
    expect(result).toEqual({
      queue: 'pkg',
      jobId: 'build-pkg|com.example.foo',
      added: true,
    });
  });
});
