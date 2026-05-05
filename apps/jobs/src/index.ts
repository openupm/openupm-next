import { CronJob } from 'cron';
import configRaw from 'config';
import { createLogger } from '@openupm/server-common/build/log.js';
import { pingHealthcheck } from '@openupm/server-common/build/healthchecks.js';
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

function getJobLoggerName(name: string): string {
  return `@openupm/jobs/${name.replace(/Job$/, '')}`;
}

function isJobEnabled(name: string): boolean {
  return config.jobs?.[name]?.enabled !== false;
}

function getHealthcheckPingUrl(name: string): string | undefined {
  return config.jobs?.[name]?.healthcheckPingUrl;
}

function scheduleJob(
  name: string,
  cronTime: string,
  run: (jobLogger: ReturnType<typeof createLogger>) => Promise<void>,
): void {
  const jobLogger = createLogger(getJobLoggerName(name));
  if (!isJobEnabled(name)) {
    jobLogger.info(`${name} is disabled.`);
    return;
  }
  new CronJob(
    cronTime,
    async () => {
      const startedAt = Date.now();
      const healthcheckPingUrl = getHealthcheckPingUrl(name);
      jobLogger.info({ jobName: name, cronTime }, 'job begin');
      await pingHealthcheck(healthcheckPingUrl, 'start', jobLogger);
      try {
        await run(jobLogger);
        await pingHealthcheck(healthcheckPingUrl, 'success', jobLogger);
        jobLogger.info(
          { jobName: name, cronTime, durationMs: Date.now() - startedAt },
          'job end',
        );
      } catch (err) {
        await pingHealthcheck(healthcheckPingUrl, 'fail', jobLogger);
        jobLogger.error(
          { err, jobName: name, cronTime, durationMs: Date.now() - startedAt },
          'job failed',
        );
      }
    },
    () => {
      jobLogger.info({ jobName: name, cronTime }, 'job completed');
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
    async (jobLogger) =>
      await fetchPackageToAdAssetStoreIdsJob(null, true, jobLogger),
  );
  scheduleJob(
    'fetchTopicToAdAssetStoreIdsJob',
    '0 18 * * *',
    async (jobLogger) =>
      await fetchTopicToAdAssetStoreIdsJob([], true, jobLogger),
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
