import redis from '@openupm/server-common/build/redis.js';

/**
 * Each topic to ad-assetstore id list is stored in redis as a key-value pair.
 * The key is 'ad:pkg2as:<topic-slug>'.
 * The value is a JSON string of ad-assetstore id list.
 */

const REDIS_KEY_TOPIC_TO_AD_ASSETSTORE_IDS_PREFIX = 'ad:topic2asids:';

/**
 * Get the redis key for the topic to ad-assetstore id list.
 * @param {string} topicSlug - The slug of the topic.
 * @returns {string} The redis key.
 */
export const getRedisKeyForTopicToAdAssetStoreIds = function (
  topicSlug: string,
): string {
  return REDIS_KEY_TOPIC_TO_AD_ASSETSTORE_IDS_PREFIX + topicSlug;
};

/**
 * Retrieves the ad-assetstore id list for a given topic slug.
 * @param {string} topicSlug - The slug of the topic.
 * @returns {Promise<string[]>} - A promise that resolves to an array of ad-assetstore id.
 */
export async function getTopicToAdAssetStoreIds(
  topicSlug: string,
): Promise<string[]> {
  const key = getRedisKeyForTopicToAdAssetStoreIds(topicSlug);
  const jsonText = await redis.client!.get(key);
  const data: string[] = jsonText === null ? [] : JSON.parse(jsonText);
  return data;
}

/**
 * Sets ad-assetstore id list for a given topic slug.
 * @param {string} topicSlug - The slug of the topic.
 * @param {string[]} ids - An array of ad-assetstore id.
 * @returns {Promise<void>} - A promise that resolves when the ad-assetstore id list is successfully set.
 */
export const setTopicToAdAssetStoreIds = async function (
  topicSlug: string,
  ids: string[],
): Promise<void> {
  const jsonText = JSON.stringify(ids, null, 0);
  const key: string = getRedisKeyForTopicToAdAssetStoreIds(topicSlug);
  await redis.client!.set(key, jsonText);
};
