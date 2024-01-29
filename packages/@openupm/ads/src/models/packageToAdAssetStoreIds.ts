import redis from '@openupm/server-common/build/redis.js';

/**
 * Each package to ad-assetstore id list is stored in redis as a key-value pair.
 * The key is 'ad:pkg2as:<package-name>'.
 * The value is a JSON string of ad-assetstore id list.
 */

const REDIS_KEY_PACKAGE_TO_AD_ASSETSTORE_IDS_PREFIX = 'ad:pkg2asids:';

/**
 * Get the redis key for the package to ad-assetstore id list.
 * @param {string} packageName - The name of the package.
 * @returns {string} The redis key.
 */
export const getRedisKeyForPackageToAdAssetStoreIds = function (
  packageName: string,
): string {
  return REDIS_KEY_PACKAGE_TO_AD_ASSETSTORE_IDS_PREFIX + packageName;
};

/**
 * Retrieves the ad-assetstore id list for a given package name.
 * @param {string} packageName - The name of the package.
 * @returns {Promise<string[]>} - A promise that resolves to an array of ad-assetstore id.
 */
export async function getPackageToAdAssetStoreIds(
  packageName: string,
): Promise<string[]> {
  const key = getRedisKeyForPackageToAdAssetStoreIds(packageName);
  const jsonText = await redis.client!.get(key);
  const data: string[] = jsonText === null ? [] : JSON.parse(jsonText);
  return data;
}

/**
 * Sets ad-assetstore id list for a given package name.
 * @param {string} packageName - The name of the package.
 * @param {string[]} ids - An array of ad-assetstore id.
 * @returns {Promise<void>} - A promise that resolves when the ad-assetstore id list is successfully set.
 */
export const setPackageToAdAssetStoreIds = async function (
  packageName: string,
  ids: string[],
): Promise<void> {
  const jsonText = JSON.stringify(ids, null, 0);
  const key: string = getRedisKeyForPackageToAdAssetStoreIds(packageName);
  await redis.client!.set(key, jsonText);
};
