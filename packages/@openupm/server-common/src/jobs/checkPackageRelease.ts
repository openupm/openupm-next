// import config from 'config';
import { Logger } from 'ts-log';
import fetch, { AbortError } from 'node-fetch';
import { pRateLimit } from 'p-ratelimit/build/src/rateLimit.js';

import { Packument } from '@openupm/types';
import { getPackumentUrl } from '@openupm/common/build/urls.js';
import {
  loadPackageNames,
  loadPackageMetadataLocal,
} from '@openupm/local-data';
import { createLogger } from '../log.js';
import { runWithTimeoutSignal } from '../utils/runWithTimeoutSignal.js';

const logger = createLogger('adAssetStore');
const fetchPackumentRateLimit = pRateLimit({
  interval: 1000, // ms
  rate: 2,
});

/**
 * Check release for given packages
 * @param packageNames The packages to check
 * @param all If true, check all packages
 */
export async function checkReleaseJob(
  packageNames: string[] | null,
  all?: boolean,
): Promise<void> {
  // Check if all packages should be checked
  if (all) packageNames = await loadPackageNames({ sortKey: 'name' });
  if (!packageNames) return;
  // Process each package
  for (const packageName of packageNames) {
    try {
      await checkRelease(packageName, logger);
    } catch (err) {
      logger.error({ err: err }, `failed to check release for ${packageName}`);
    }
  }
}

async function checkRelease(
  packageName: string,
  logger: Logger,
): Promise<void> {
  const metadataLocal = await loadPackageMetadataLocal(packageName);
  if (metadataLocal === null) {
    logger.error(`failed to load MetadataLocal for ${packageName} `);
    return;
  }
  // Skip if the package is created within 3 months
  const epoch3MonthsAgo = Date.now() - 3 * 30.5 * 24 * 60 * 60 * 1000;
  if (metadataLocal.createdAt && metadataLocal.createdAt > epoch3MonthsAgo)
    return;
  // Log package with no release
  const result = await fetchPackumentRateLimit(() =>
    fetchPackument(packageName),
  );
  if (result.status === 404) {
    logger.warn({ packageName }, `package ${packageName} has no release`);
  }
}

type FetchPackumentResult = {
  packument: Packument | null;
  status: number;
};

/**
 * Fetch packument for given package name from OpenUPM registry.
 * @param packageName packageName
 */
async function fetchPackument(
  packageName: string,
): Promise<FetchPackumentResult> {
  try {
    return await runWithTimeoutSignal(
      async (signal): Promise<FetchPackumentResult> => {
        const url = getPackumentUrl(packageName);
        const resp = await fetch(url, {
          headers: {
            accept: '*/*',
          },
          method: 'GET',
          signal,
        });
        if (resp.ok) {
          const packument = (await resp.json()) as Packument;
          return { packument, status: resp.status };
        }
        return {
          packument: null,
          status: resp.status,
        };
      },
    );
  } catch (err) {
    // If the error is an abort error, throw a timeout error.
    if (err instanceof AbortError) {
      throw new Error(`fetchPackument timeout for packageName ${packageName}`);
    }
    throw err;
  }
}
