import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  eval: vi.fn(),
  set: vi.fn(),
}));

vi.mock('@openupm/server-common/build/redis.js', () => ({
  default: {
    client: {
      eval: mocks.eval,
      set: mocks.set,
    },
  },
}));

import {
  ReleaseMutationLockedError,
  withReleaseMutationLock,
} from '../../src/utils/releaseMutationLock.js';

describe('withReleaseMutationLock', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.set.mockResolvedValue('OK');
    mocks.eval.mockResolvedValue(1);
  });

  it('holds the release lock while running the mutation', async () => {
    const action = vi.fn().mockResolvedValue('done');

    await expect(
      withReleaseMutationLock('com.foo.bar', '1.2.3', action),
    ).resolves.toBe('done');

    expect(mocks.set).toHaveBeenCalledWith(
      'lock:release-mutation:com.foo.bar:1.2.3',
      expect.any(String),
      'PX',
      300000,
      'NX',
    );
    expect(action).toHaveBeenCalledOnce();
    expect(mocks.eval).toHaveBeenCalledOnce();
  });

  it('refuses a concurrent mutation', async () => {
    mocks.set.mockResolvedValue(null);
    const action = vi.fn();

    await expect(
      withReleaseMutationLock('com.foo.bar', '1.2.3', action),
    ).rejects.toEqual(new ReleaseMutationLockedError('com.foo.bar', '1.2.3'));

    expect(action).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
  });

  it('releases the lock when the mutation fails', async () => {
    const error = new Error('mutation failed');

    await expect(
      withReleaseMutationLock('com.foo.bar', '1.2.3', async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(mocks.eval).toHaveBeenCalledOnce();
  });
});
