import { CronJob } from 'cron';
import configRaw from 'config';
import { createLogger } from '@openupm/server-common/build/log.js';
import {
  fetchPackageToAdAssetStoreIdsJob,
  fetchTopicToAdAssetStoreIdsJob,
} from '@openupm/ads/build/jobs/adAssetStore.js';
import { aggregatePackageExtraJob } from './jobs/aggregatePackageExtra.js';
import { fetchBackerDataJob } from './jobs/fetchBackerData.js';
import { fetchPackageExtraJob } from './jobs/fetchPackageExtra.js';
import { fetchSiteInfoJob } from './jobs/fetchSiteInfo.js';
import { updateRecentPackagesJob } from './jobs/updateRecentPackages.js';
import { updateFeedsJob } from './jobs/updateFeeds.js';

const logger = createLogger('@openupm/jobs');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

function isJobEnabled(name: string): boolean {
  return config.jobs?.[name]?.enabled !== false;
}

function scheduleJob(
  name: string,
  cronTime: string,
  run: () => Promise<void>,
): void {
  if (!isJobEnabled(name)) {
    logger.info(`${name} is disabled.`);
    return;
  }
  new CronJob(
    cronTime,
    async () => {
      logger.info(`${name} starts.`);
      await run();
      logger.info(`${name} ends.`);
    },
    () => {
      console.log(`${name} is completed.`);
    },
    true,
  );
}

/**
 * Main entry point for the jobs service.
 */
function main(): void {
  logger.info('Jobs service is running.');
  scheduleJob(
    'fetchPackageToAdAssetStoreIdsJob',
    '0 0 * * *',
    async () => await fetchPackageToAdAssetStoreIdsJob(null, true),
  );
  scheduleJob(
    'fetchTopicToAdAssetStoreIdsJob',
    '0 18 * * *',
    async () => await fetchTopicToAdAssetStoreIdsJob([], true),
  );
  scheduleJob(
    'aggregatePackageExtraJob',
    '*/5 * * * *',
    async () => await aggregatePackageExtraJob(),
  );
  scheduleJob(
    'updateFeedsJob',
    '*/5 * * * *',
    async () => await updateFeedsJob(),
  );
  scheduleJob(
    'fetchSiteInfoJob',
    '*/5 * * * *',
    async () => await fetchSiteInfoJob(),
  );
  scheduleJob(
    'fetchBackerDataJob',
    '*/30 * * * *',
    async () => await fetchBackerDataJob(false),
  );
  scheduleJob(
    'updateRecentPackagesJob',
    '*/5 * * * *',
    async () => await updateRecentPackagesJob(),
  );
  scheduleJob(
    'fetchPackageExtraJob',
    '1 */2 * * *',
    async () => await fetchPackageExtraJob(null, { all: true, force: false }),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
