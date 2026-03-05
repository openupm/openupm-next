import { describe, expect, it, vi } from 'vitest';

import { addJob } from '../../src/queues/core.js';

describe('addJob', () => {
  it('skips duplicated jobId', async () => {
    const queue = {
      getJob: vi.fn().mockResolvedValue({ id: '1' }),
      add: vi.fn(),
    };

    const result = await addJob({
      queue,
      name: 'build-pkg',
      opts: { jobId: 'build-pkg:com.a' },
    });

    expect(result).toBeNull();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('adds new job when no duplication', async () => {
    const queue = {
      getJob: vi.fn().mockResolvedValue(null),
      add: vi.fn().mockResolvedValue({ id: '2' }),
    };

    const result = await addJob({
      queue,
      name: 'build-pkg',
      data: { name: 'com.a' },
      opts: { jobId: 'build-pkg:com.a' },
    });

    expect(result).toEqual({ id: '2' });
    expect(queue.add).toHaveBeenCalled();
  });
});
