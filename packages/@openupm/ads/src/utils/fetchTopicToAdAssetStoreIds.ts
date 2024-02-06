import config from 'config';
import { Logger } from 'ts-log';

import { TopicBase } from '@openupm/types';
import { fetchAdAssetStoreListForKeywords } from './fetchAssetStore.js';
import { setTopicToAdAssetStoreIds } from '../models/topicToAdAssetStoreIds.js';

/**
 * Fetches AdAssetStore id list for a given topic slug.
 * @param topic The TopicBase object
 * @param logger The logger.
 * @returns The AdAssetStore id list.
 */
export async function fetchTopicToAdAssetStoreIds(
  topic: TopicBase,
  logger: Logger,
): Promise<string[] | null> {
  // Get keywords for the topic.
  const keywords = topic.keywords;
  if (keywords.length) logger.info(`keywords: ${keywords.join(', ')}`);
  // fetch ad-assetstore list for the keywords.
  const adAssetStoreIds: string[] = await fetchAdAssetStoreListForKeywords(
    keywords,
    "popularity",
    config.topicToAdAssetStoreIdListSize,
    logger,
  );
  if (adAssetStoreIds.length === 0) return null;
  // save topic to adAssetStore id list.
  await setTopicToAdAssetStoreIds(topic.slug, adAssetStoreIds);
  logger.info(
    `saved adAssetStore id list [${adAssetStoreIds}] for topic ${topic.slug}`,
  );
  return adAssetStoreIds;
}
