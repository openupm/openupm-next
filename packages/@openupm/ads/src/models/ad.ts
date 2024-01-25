import { AdAssetStore } from '@openupm/types';

import redis from '@openupm/server-common/build/redis.js';

/**
 * Each ad-assetstore is stored in redis as a key-value pair.
 * The key is 'ad:as:<ad-assetstore-id>'.
 * The value is a JSON string of AdAssetStore.
 *
 * Each package to assetstore list is stored in redis as a key-value pair.
 * The key is 'ad:pkg2as:<package-name>'.
 * The value is a JSON string of string array which contains the ad-assetstore ids.
 */

const REDIS_KEY_AD_ASSETSTORE_PREFIX = 'ad:as:';
const REDIS_KEY_AD_PACKAGE_TO_ASSETSTORE_PREFIX = 'ad:pkg2as:';

/**
 * Get the redis key for the ad-assetstore id.
 * @param {string} id - The id of the ad-assetstore.
 * @returns {string} The redis key.
 */
export const getRedisKeyForAdAssetStore = function (id: string): string {
  return REDIS_KEY_AD_ASSETSTORE_PREFIX + id;
};

/**
 * Retrieves the ad asset store for the ad-assetstore id.
 * @param {string} id - The id of the ad-assetstore.
 * @returns {Promise<AdAssetStore | null>} - A promise that resolves to an AdAssetStore.
 */
export async function getAdAssetStore(
  packageName: string,
): Promise<AdAssetStore | null> {
  const key = getRedisKeyForAdAssetStore(packageName);
  const jsonText = await redis.client!.get(key);
  if (jsonText !== null) return JSON.parse(jsonText);
  return null;
}

/**
 * Sets the ad asset store for the ad-assetstore id.
 * @param {string} id - The id of the ad-assetstore.
 * @param {AdAssetStore} data - An AdAssetStore representing the ad asset store.
 * @returns {Promise<void>} - A promise that resolves when the ad asset store is successfully set.
 */
export const setAdAssetStore = async function (
  packageName: string,
  data: AdAssetStore,
): Promise<void> {
  const jsonText = JSON.stringify(data, null, 0);
  const key: string = getRedisKeyForAdAssetStore(packageName);
  await redis.client!.set(key, jsonText);
};

/**
 * Get the redis key for the package to assetstore list.
 * @param {string} packageName - The name of the package.
 * @returns {string} The redis key.
 */
export const getRedisKeyForAdPackageToAssetStore = function (
  packageName: string,
): string {
  return REDIS_KEY_AD_PACKAGE_TO_ASSETSTORE_PREFIX + packageName;
};

/**
 * Retrieves the package to assetstore list for a given package name.
 * @param {string} packageName - The name of the package.
 * @returns {Promise<string[]>} - A promise that resolves to an array of asset store id.
 */
export async function getAdPackageToAssetStore(
  packageName: string,
): Promise<string[]> {
  const key = getRedisKeyForAdPackageToAssetStore(packageName);
  const jsonText = await redis.client!.get(key);
  const data: string[] = jsonText === null ? [] : JSON.parse(jsonText);
  return data;
}

/**
 * Sets the package to assetstore list for a given package name.
 * @param {string} packageName - The name of the package.
 * @param {string[]} data - An array of asset store id.
 * @returns {Promise<void>} - A promise that resolves when the ad asset store is successfully set.
 */
export const setAdPackageToAssetStore = async function (
  packageName: string,
  data: string[],
): Promise<void> {
  const jsonText = JSON.stringify(data, null, 0);
  const key: string = getRedisKeyForAdPackageToAssetStore(packageName);
  await redis.client!.set(key, jsonText);
};
