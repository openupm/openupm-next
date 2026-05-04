import { CronJob } from 'cron';
import configRaw from 'config';
import { pingHealthcheck } from '@openupm/server-common/build/healthchecks.js';
import { createLogger } from '@openupm/server-common/build/log.js';

import {
  addBuildPackageJobs,
  getPackageNamesFromArgs,
} from './jobs/addBuildPackageJob.js';
import { dispatch } from './queues/process.js';

const logger = createLogger('@openupm/queue');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

type ParsedArgs =
  | { command: 'process'; queueName: string }
  | { command: 'add-build-package-job'; all: boolean; names: string[] }
  | { command: 'schedule'; jobName: string };

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const command = args[0];

  if (command === 'process') {
    const queueName = args[1];
    if (!queueName) throw new Error('Usage: process <queue>');
    return { command, queueName };
  }

  if (command === 'add-build-package-job') {
    const all = args.includes('--all');
    const names = args.filter((x) => x !== '--all').slice(1);
    return { command, all, names };
  }

  if (command === 'schedule') {
    const jobName = args[1];
    if (!jobName) throw new Error('Usage: schedule <job>');
    return { command, jobName };
  }

  throw new Error(
    'Usage: process <queue> | add-build-package-job [--all] [name...] | schedule <job>',
  );
}

async function runAddBuildPackageJob(): Promise<void> {
  const packageNames = await getPackageNamesFromArgs({
    all: true,
    names: [],
  });
  if (packageNames.length === 0) {
    throw new Error('No package names found for add-build-package-job --all.');
  }
  await addBuildPackageJobs(packageNames);
}

function scheduleAddBuildPackageJob(): void {
  const jobConfig = config.schedules?.addBuildPackageJob ?? {};
  if (jobConfig.enabled === false) {
    logger.info('addBuildPackageJob schedule is disabled.');
    return;
  }

  const cronTime = jobConfig.cronTime || '*/5 * * * *';
  new CronJob(
    cronTime,
    async () => {
      const healthcheckPingUrl = jobConfig.healthcheckPingUrl;
      logger.info('addBuildPackageJob schedule starts.');
      await pingHealthcheck(healthcheckPingUrl, 'start', logger);
      try {
        await runAddBuildPackageJob();
        await pingHealthcheck(healthcheckPingUrl, 'success', logger);
        logger.info('addBuildPackageJob schedule ends.');
      } catch (err) {
        await pingHealthcheck(healthcheckPingUrl, 'fail', logger);
        logger.error({ err }, 'addBuildPackageJob schedule failed.');
      }
    },
    null,
    true,
  );
  logger.info({ cronTime }, 'addBuildPackageJob schedule is running.');
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);
  if (parsed.command === 'process') {
    await dispatch(parsed.queueName);
    return;
  }

  if (parsed.command === 'schedule') {
    if (parsed.jobName !== 'add-build-package-job') {
      throw new Error(`Unknown schedule job: ${parsed.jobName}`);
    }
    scheduleAddBuildPackageJob();
    return;
  }

  const packageNames = await getPackageNamesFromArgs({
    all: parsed.all,
    names: parsed.names,
  });
  if (packageNames.length === 0) {
    throw new Error('No package names provided. Use --all or pass names.');
  }
  await addBuildPackageJobs(packageNames);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error({ err }, 'queue app failed');
    process.exit(1);
  });
}

export { main, parseArgs, runAddBuildPackageJob, scheduleAddBuildPackageJob };
