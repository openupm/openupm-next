import config from 'config';
import { Logger } from 'ts-log';

import { loadPackageMetadataLocal } from '@openupm/local-data';
import { getKeywords } from './keyword.js';
import { fetchAdAssetStoreListForKeywords } from './fetchAssetStore.js';
import { collectTextFromPackage } from './collectText.js';
import { setPackageToAdAssetStoreIds } from '../models/packageToAdAssetStoreIds.js';

/**
 * Fetches AdAssetStore id list for a given package name.
 * @param packageName The name of the package.
 * @param logger The logger.
 * @returns The AdAssetStore id list.
 */
export async function fetchPackageToAdAssetStoreIds(
  packageName: string,
  logger: Logger,
): Promise<string[] | null> {
  const pkg = await loadPackageMetadataLocal(packageName);
  if (pkg === null) {
    logger.warn(`package ${packageName} not found`);
    return null;
  }
  // Get text for the package.
  const text = collectTextFromPackage(pkg);
  // Get keywords for the text.
  const result = await getKeywords(text);
  // Merge keywords and keyphrases into a single array.
  const keywords = [...result.keyphrases, ...result.keywords];
  if (keywords.length) logger.info(`keywords: ${keywords.join(', ')}`);
  // fetch ad-assetstore list for the keywords.
  const adAssetStoreIds: string[] = await fetchAdAssetStoreListForKeywords(
    keywords,
    config.packageToAdAssetStoreIdListSize,
    logger,
  );
  if (adAssetStoreIds.length === 0) return null;
  // save package to adAssetStore id list.
  const ids = adAssetStoreIds.slice(0, config.packageToAdAssetStoreIdListSize);
  await setPackageToAdAssetStoreIds(packageName, ids);
  logger.info(`saved adAssetStore id list [${ids}] for package ${packageName}`);
  return adAssetStoreIds;
}
