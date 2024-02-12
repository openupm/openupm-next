// import config from 'config';
import { Logger } from 'ts-log';

import {
  loadPackageNames,
  loadPackageMetadataLocal,
} from '@openupm/local-data';
import { createLogger } from '../log.js';

const logger = createLogger('adAssetStore');

/**
 * Check license for given packages
 * @param packageNames The packages to check
 * @param all If true, check all packages
 */
export async function checkLicenseJob(
  packageNames: string[] | null,
  all?: boolean,
): Promise<void> {
  // Check if all packages should be checked
  if (all) packageNames = await loadPackageNames({ sortKey: 'name' });
  if (!packageNames) return;
  // Process each package
  for (const packageName of packageNames) {
    try {
      await checkLicense(packageName, logger);
    } catch (err) {
      logger.error({ err: err }, `failed to check license for ${packageName}`);
    }
  }
}

async function checkLicense(
  packageName: string,
  logger: Logger,
): Promise<void> {
  const metadataLocal = await loadPackageMetadataLocal(packageName);
  if (metadataLocal === null) {
    logger.error(`failed to load MetadataLocal for ${packageName} `);
    return;
  }
  if (!metadataLocal.licenseName) {
    if (metadataLocal.licenseSpdxId) {
      logger.warn(
        `${packageName} licenseName is empty but licenseSpdxId=${metadataLocal.licenseSpdxId}`,
      );
    } else {
      logger.warn(`${packageName} licenseName is empty`);
    }
  }
}
