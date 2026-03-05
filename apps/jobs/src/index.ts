import { CronJob } from 'cron';
import { createLogger } from '@openupm/server-common/build/log.js';
import {
  fetchPackageToAdAssetStoreIdsJob,
  fetchTopicToAdAssetStoreIdsJob,
} from '@openupm/ads/build/jobs/adAssetStore.js';
import { aggregatePackageExtraJob } from './jobs/aggregatePackageExtra.js';
import { fetchBackerDataJob } from './jobs/fetchBackerData.js';
import { fetchPackageExtraJob } from './jobs/fetchPackageExtra.js';
import { fetchSiteInfoJob } from './jobs/fetchSiteInfo.js';
import { updateFeedsJob } from './jobs/updateFeeds.js';

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
  // aggregatePackageExtraJob
  new CronJob(
    '*/5 * * * *',
    async () => {
      logger.info('aggregatePackageExtraJob starts.');
      await aggregatePackageExtraJob();
      logger.info('aggregatePackageExtraJob ends.');
    },
    () => {
      console.log('aggregatePackageExtraJob is completed.');
    },
    true,
  );
  // updateFeedsJob
  new CronJob(
    '*/5 * * * *',
    async () => {
      logger.info('updateFeedsJob starts.');
      await updateFeedsJob();
      logger.info('updateFeedsJob ends.');
    },
    () => {
      console.log('updateFeedsJob is completed.');
    },
    true,
  );
  // fetchSiteInfoJob
  new CronJob(
    '*/5 * * * *',
    async () => {
      logger.info('fetchSiteInfoJob starts.');
      await fetchSiteInfoJob();
      logger.info('fetchSiteInfoJob ends.');
    },
    () => {
      console.log('fetchSiteInfoJob is completed.');
    },
    true,
  );
  // fetchBackerDataJob
  new CronJob(
    '*/30 * * * *',
    async () => {
      logger.info('fetchBackerDataJob starts.');
      await fetchBackerDataJob(false);
      logger.info('fetchBackerDataJob ends.');
    },
    () => {
      console.log('fetchBackerDataJob is completed.');
    },
    true,
  );
  // fetchPackageExtraJob
  new CronJob(
    '1 */2 * * *',
    async () => {
      logger.info('fetchPackageExtraJob starts.');
      await fetchPackageExtraJob(null, { all: true, force: false });
      logger.info('fetchPackageExtraJob ends.');
    },
    () => {
      console.log('fetchPackageExtraJob is completed.');
    },
    true,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
