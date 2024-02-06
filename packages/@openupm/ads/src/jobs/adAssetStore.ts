import { loadPackageNames } from '@openupm/local-data';
import { createLogger } from '@openupm/server-common/build/log.js';
import { fetchPackageToAdAssetStoreIds } from '../utils/fetchPackageToAdAssetStoreIds.js';

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
