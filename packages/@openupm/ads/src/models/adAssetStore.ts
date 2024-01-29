import { AdAssetStore } from '@openupm/types';

import redis from '@openupm/server-common/build/redis.js';

/**
 * Each ad-assetstore is stored in redis as a key-value pair.
 * The key is 'ad:as:<ad-assetstore-id>'.
 * The value is a JSON string of AdAssetStore.
 */

const REDIS_KEY_AD_ASSETSTORE_PREFIX = 'ad:as:';

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
