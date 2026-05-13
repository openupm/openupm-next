/* Release model.
 *
 * Redis structure: rel:$name: hash{ version => JSON }
 * e.g.
 *     rel:com.company.sample-package
 *       1.0.0: JSON_STRING
 *       1.0.1: JSON_STRING
 */

import { pick } from 'lodash-es';
import { ReleaseModel, releaseModelFields, ReleaseState } from '@openupm/types';

import redis from '../redis.js';

const REDIS_KEY_RELEASE_PREFIX = 'rel:';
const REDIS_KEY_RECENT_SUCCEEDED_RELEASES = 'rel:index:succeeded';
const REDIS_KEY_RECENT_FAILED_RELEASES = 'rel:index:failed';

type ReleaseHistoryState = 'succeeded' | 'failed';

/**
 * Get the redis key for a release hashset.
 * @param {string} packageName - The name of the package.
 * @returns {string} The key for the package.
 */
export const getRedisKeyForRelease = function (packageName: string): string {
  return REDIS_KEY_RELEASE_PREFIX + packageName;
};

export function getRedisKeyForRecentReleases(
  state: ReleaseHistoryState,
): string {
  return state === 'succeeded'
    ? REDIS_KEY_RECENT_SUCCEEDED_RELEASES
    : REDIS_KEY_RECENT_FAILED_RELEASES;
}

function getReleaseIndexMember(packageName: string, version: string): string {
  return JSON.stringify([packageName, version]);
}

function parseReleaseIndexMember(
  value: string,
): { packageName: string; version: string } | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [packageName, version] = parsed;
    if (typeof packageName !== 'string' || typeof version !== 'string') {
      return null;
    }
    return { packageName, version };
  } catch {
    return null;
  }
}

async function updateRecentReleaseIndexes(record: ReleaseModel): Promise<void> {
  const member = getReleaseIndexMember(record.packageName, record.version);
  const succeededKey = getRedisKeyForRecentReleases('succeeded');
  const failedKey = getRedisKeyForRecentReleases('failed');
  const score = record.updatedAt || Date.now();

  if (record.state === ReleaseState.Succeeded) {
    await redis
      .client!.multi()
      .zadd(succeededKey, score, member)
      .zrem(failedKey, member)
      .exec();
    return;
  }

  if (record.state === ReleaseState.Failed) {
    await redis
      .client!.multi()
      .zadd(failedKey, score, member)
      .zrem(succeededKey, member)
      .exec();
    return;
  }

  await redis
    .client!.multi()
    .zrem(succeededKey, member)
    .zrem(failedKey, member)
    .exec();
}

/**
 * Saves a release object to Redis.
 * If the release already exists, it will be updated with the new data.
 * If the release does not exist, a new release will be created.
 *
 * @param obj The release object to be saved.
 * @returns The updated release object.
 * @throws Error if the packageName or version is missing in the release object.
 */
export async function save(
  obj: Partial<ReleaseModel> &
    Required<Pick<ReleaseModel, 'packageName' | 'version'>>,
): Promise<ReleaseModel> {
  if (!obj.packageName || !obj.version)
    throw new Error(
      `Can not create or update release with packageName=${obj.packageName} version=${obj.version}`,
    );
  const now = new Date().getTime();
  const existing = await fetchOne(obj.packageName, obj.version);
  const record: ReleaseModel = existing || {
    packageName: obj.packageName,
    version: '',
    commit: '',
    tag: '',
    state: 0,
    buildId: '',
    reason: 0,
    createdAt: now,
    updatedAt: now,
    source: 'git',
    signed: false,
  };
  Object.assign(record, pick(obj, releaseModelFields));
  record.updatedAt = now;
  const jsonText = JSON.stringify(record, null, 0);
  const key = getRedisKeyForRelease(record.packageName);
  await redis.client!.hset(key, record.version, jsonText);
  await updateRecentReleaseIndexes(record);
  Object.assign(obj, record);
  return obj as ReleaseModel;
}

function normalizeReleaseModel(obj: ReleaseModel): ReleaseModel {
  return {
    source: 'git',
    signed: false,
    ...obj,
  };
}

/**
 * Removes a release from Redis.
 *
 * @param packageName The name of the package.
 * @param version The version of the release.
 * @throws Error if the packageName or version is missing.
 */
export async function remove(
  packageName: string,
  version: string,
): Promise<void> {
  if (!packageName || !version)
    throw new Error(
      `Can not remove release with packageName=${packageName} version=${version}`,
    );
  const key = getRedisKeyForRelease(packageName);
  const member = getReleaseIndexMember(packageName, version);
  await redis
    .client!.multi()
    .hdel(key, version)
    .zrem(getRedisKeyForRecentReleases('succeeded'), member)
    .zrem(getRedisKeyForRecentReleases('failed'), member)
    .exec();
}

/**
 * Fetches a single release from Redis based on the package name and version.
 *
 * @param packageName The name of the package.
 * @param version The version of the release.
 * @returns The fetched release object, or null if it doesn't exist.
 */
export async function fetchOne(
  packageName: string,
  version: string,
): Promise<ReleaseModel | null> {
  const key = getRedisKeyForRelease(packageName);
  const obj = await redis.client!.hget(key, version);
  if (obj === null) return null;
  return normalizeReleaseModel(JSON.parse(obj) as ReleaseModel);
}

/**
 * Fetches a single release from Redis based on the package name and version.
 * Throws an error if the release does not exist.
 *
 * @param packageName The name of the package.
 * @param version The version of the release.
 * @returns The fetched release object.
 * @throws Error if the release does not exist.
 */
export async function fetchOneOrThrow(
  packageName: string,
  version: string,
): Promise<ReleaseModel> {
  const obj = await fetchOne(packageName, version);
  if (obj === null)
    throw new Error(
      `Failed to fetch package name=${packageName} version=${version}}`,
    );
  return obj;
}

/**
 * Fetches all releases for a given package from Redis.
 *
 * @param packageName The name of the package.
 * @returns An array of all release objects for the package.
 */
export async function fetchAll(packageName: string): Promise<ReleaseModel[]> {
  const key = getRedisKeyForRelease(packageName);
  const objs = await redis.client!.hgetall(key);
  return Object.values(objs).map((x) =>
    normalizeReleaseModel(JSON.parse(x) as ReleaseModel),
  );
}

export async function fetchRecentReleases(
  state: ReleaseHistoryState,
  limit: number,
): Promise<ReleaseModel[]> {
  if (!Number.isInteger(limit) || limit < 1) return [];
  const key = getRedisKeyForRecentReleases(state);
  const members = await redis.client!.zrevrange(key, 0, limit - 1);
  const releases: ReleaseModel[] = [];
  const expectedState =
    state === 'succeeded' ? ReleaseState.Succeeded : ReleaseState.Failed;

  for (const member of members) {
    const parsed = parseReleaseIndexMember(member);
    if (!parsed) continue;
    const release = await fetchOne(parsed.packageName, parsed.version);
    if (!release || release.state !== expectedState) continue;
    releases.push(release);
  }

  releases.sort((a, b) => b.updatedAt - a.updatedAt);
  return releases.slice(0, limit);
}
