import config from 'config';

import { TOPIC_ALL_SLUG } from '@openupm/types';
import { loadPackageNames, loadTopics } from '@openupm/local-data';
import { createLogger } from '@openupm/server-common/build/log.js';
import { fetchPackageToAdAssetStoreIds } from '../utils/fetchPackageToAdAssetStoreIds.js';
import { fetchTopicToAdAssetStoreIds } from '../utils/fetchTopicToAdAssetStoreIds.js';
import { setTopicToAdAssetStoreIds } from '../models/index.js';

const logger = createLogger('adAssetStore');

/**
 * Fetch ad-assetstore for given packages
 * @param packageNames The packages that should be fetched
 * @param all If true, fetch all packages
 */
export async function fetchPackageToAdAssetStoreIdsJob(
  packageNames: string[] | null,
  all?: boolean,
): Promise<void> {
  // Check if all packages should be fetched
  if (all) packageNames = await loadPackageNames({ sortKey: 'name' });
  if (!packageNames) return;
  // Process each package
  for (const packageName of packageNames) {
    try {
      logger.info(`fetching ad-assetstore ids for ${packageName}`);
      await fetchPackageToAdAssetStoreIds(packageName, logger);
    } catch (err) {
      logger.error(
        { err: err },
        `failed to fetch ad-assetstore ids for ${packageName}`,
      );
    }
  }
}

export async function fetchTopicToAdAssetStoreIdsJob(
  topicSlugs: string[],
  all?: boolean,
): Promise<void> {
  const topics = (await loadTopics()).filter(
    (topic) => all || topicSlugs.includes(topic.slug),
  );
  if (topics.length === 0) {
    logger.warn(`topic ${topicSlugs} not found`);
    return;
  }
  const allIdSet = new Set<string>();
  for (const topic of topics) {
    try {
      logger.info(`fetching ad-assetstore ids for topic ${topic.slug}`);
      const ids = (await fetchTopicToAdAssetStoreIds(topic, logger)) || [];
      for (const id of ids) allIdSet.add(id);
    } catch (err) {
      logger.error(
        { err: err },
        `failed to fetch ad-assetstore ids for topic ${topic.slug}`,
      );
    }
  }
  // Aggregate for TOPIC_ALL_SLUG
  if (all) {
    const allIdsArray = Array.from(allIdSet);
    // Shuffle the array
    allIdsArray.sort(() => Math.random() - 0.5);
    // Limit the array size
    const pickedAllIds = allIdsArray.slice(
      0,
      config.topicToAdAssetStoreIdListSize,
    );
    await setTopicToAdAssetStoreIds(TOPIC_ALL_SLUG, pickedAllIds);
    logger.info(
      `saved adAssetStore id list [${pickedAllIds}] for topic ${TOPIC_ALL_SLUG}`,
    );
  }
}
