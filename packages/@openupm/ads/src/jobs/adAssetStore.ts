import configRaw from 'config';
import { Logger } from 'ts-log';

import { TOPIC_ALL_SLUG } from '@openupm/types';
import { loadPackageNames, loadTopics } from '@openupm/local-data';
import { createLogger } from '@openupm/server-common/build/log.js';
import { fetchPackageToAdAssetStoreIds } from '../utils/fetchPackageToAdAssetStoreIds.js';
import { fetchTopicToAdAssetStoreIds } from '../utils/fetchTopicToAdAssetStoreIds.js';
import { setTopicToAdAssetStoreIds } from '../models/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

const logger = createLogger('adAssetStore');

/**
 * Fetch ad-assetstore for given packages
 * @param packageNames The packages that should be fetched
 * @param all If true, fetch all packages
 */
export async function fetchPackageToAdAssetStoreIdsJob(
  packageNames: string[] | null,
  all?: boolean,
  jobLogger: Logger = logger,
): Promise<void> {
  // Check if all packages should be fetched
  if (all) packageNames = await loadPackageNames({ sortKey: 'name' });
  if (!packageNames) return;
  // Process each package
  for (const packageName of packageNames) {
    try {
      jobLogger.info(`fetching ad-assetstore ids for ${packageName}`);
      await fetchPackageToAdAssetStoreIds(packageName, jobLogger);
    } catch (err) {
      jobLogger.error(
        { err: err },
        `failed to fetch ad-assetstore ids for ${packageName}`,
      );
    }
  }
}

export async function fetchTopicToAdAssetStoreIdsJob(
  topicSlugs: string[],
  all?: boolean,
  jobLogger: Logger = logger,
): Promise<void> {
  const topics = (await loadTopics()).filter(
    (topic) => all || topicSlugs.includes(topic.slug),
  );
  if (topics.length === 0) {
    jobLogger.warn(`topic ${topicSlugs} not found`);
    return;
  }
  const allIdSet = new Set<string>();
  for (const topic of topics) {
    try {
      jobLogger.info(`fetching ad-assetstore ids for topic ${topic.slug}`);
      const ids = (await fetchTopicToAdAssetStoreIds(topic, jobLogger)) || [];
      for (const id of ids) allIdSet.add(id);
    } catch (err) {
      jobLogger.error(
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
    jobLogger.info(
      `saved adAssetStore id list [${pickedAllIds}] for topic ${TOPIC_ALL_SLUG}`,
    );
  }
}
