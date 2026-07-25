import { randomUUID } from 'node:crypto';

import redis from '@openupm/server-common/build/redis.js';

const releaseMutationLockTtlMs = 5 * 60_000;

export class ReleaseMutationLockedError extends Error {
  constructor(packageName: string, version: string) {
    super(`Release mutation is already in progress: ${packageName}@${version}`);
    this.name = 'ReleaseMutationLockedError';
  }
}

function getReleaseMutationLockKey(
  packageName: string,
  version: string,
): string {
  return `lock:release-mutation:${packageName}:${version}`;
}

export async function withReleaseMutationLock<T>(
  packageName: string,
  version: string,
  action: () => Promise<T>,
): Promise<T> {
  const client = redis.client!;
  const key = getReleaseMutationLockKey(packageName, version);
  const token = randomUUID();
  const acquired = await client.set(
    key,
    token,
    'PX',
    releaseMutationLockTtlMs,
    'NX',
  );
  if (acquired !== 'OK') {
    throw new ReleaseMutationLockedError(packageName, version);
  }

  try {
    return await action();
  } finally {
    await client.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      end
      return 0`,
      1,
      key,
      token,
    );
  }
}
