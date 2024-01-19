/* Release model.
 *
 * Redis structure: rel:$name: hash{ version => JSON }
 * e.g.
 *     rel:com.company.sample-package
 *       1.0.0: JSON_STRING
 *       1.0.1: JSON_STRING
 */

import { pick } from 'lodash-es';
import { ReleaseModel, releaseModelFields } from '@openupm/types';

import redis from '../redis.js';

const REDIS_KEY_RELEASE_PREFIX = 'rel:';

/**
 * Get the redis key for a release hashset.
 * @param {string} packageName - The name of the package.
 * @returns {string} The key for the package.
 */
export const getRedisKeyForRelease = function (packageName: string): string {
  return REDIS_KEY_RELEASE_PREFIX + packageName;
};

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
  const record: ReleaseModel = (await fetchOne(
    obj.packageName,
    obj.version,
  )) || {
    packageName: obj.packageName,
    version: '',
    commit: '',
    tag: '',
    state: 0,
    buildId: '',
    reason: 0,
    createdAt: now,
    updatedAt: now,
  };
  Object.assign(record, pick(obj, releaseModelFields));
  record.updatedAt = now;
  const jsonText = JSON.stringify(record, null, 0);
  const key = getRedisKeyForRelease(record.packageName);
  await redis.client!.hset(key, record.version, jsonText);
  Object.assign(obj, record);
  return obj as ReleaseModel;
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
  await redis.client!.hdel(key, version);
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
  return JSON.parse(obj) as ReleaseModel;
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
  return Object.values(objs).map((x) => JSON.parse(x) as ReleaseModel);
}
