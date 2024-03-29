import { CronJob } from 'cron';
import { createLogger } from '@openupm/server-common/build/log.js';
import {
  fetchPackageToAdAssetStoreIdsJob,
  fetchTopicToAdAssetStoreIdsJob,
} from '@openupm/ads/build/jobs/adAssetStore.js';

const logger = createLogger('@openupm/jobs');

/**
 * Main entry point for the jobs service.
 */
function main(): void {
  logger.info('Jobs service is running.');
  // fetchPackageToAdAssetStoreIdsJob
  new CronJob(
    '0 0 * * *',
    async () => {
      logger.info('fetchPackageToAdAssetStoreIdsJob starts.');
      await fetchPackageToAdAssetStoreIdsJob(null, true);
      logger.info('fetchPackageToAdAssetStoreIdsJob ends.');
    },
    () => {
      console.log('fetchPackageToAdAssetStoreIdsJob is completed.');
    },
    true, // start
  );
  // fetchTopicToAdAssetStoreIdsJob
  new CronJob(
    '0 18 * * *',
    async () => {
      logger.info('fetchTopicToAdAssetStoreIdsJob starts.');
      await fetchTopicToAdAssetStoreIdsJob([], true);
      logger.info('fetchTopicToAdAssetStoreIdsJob ends.');
    },
    () => {
      console.log('fetchTopicToAdAssetStoreIdsJob is completed.');
    },
    true, // start
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
