import { CronJob } from 'cron';
import configRaw from 'config';
import { pingHealthcheck } from '@openupm/server-common/build/healthchecks.js';
import { createLogger } from '@openupm/server-common/build/log.js';

import {
  addBuildPackageJobs,
  getPackageNamesFromArgs,
} from './jobs/addBuildPackageJob.js';
import { runQueueCli } from './queueCli.js';
import { runQueueHealthcheck } from './queues/health.js';
import { dispatch } from './queues/process.js';

const logger = createLogger('@openupm/queue');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

type ParsedArgs =
  | { command: 'process'; queueName: string }
  | { command: 'add-build-package-job'; all: boolean; names: string[] }
  | { command: 'schedule'; jobName: string }
  | { command: 'queue-cli' }
  | { command: 'health'; queueNames: string[] }
  | { command: 'help' };

function getUsage(): string {
  return [
    'OpenUPM queue service command.',
    '',
    'Usage:',
    '  node build/index.js process <queue>',
    '  node build/index.js add-build-package-job [--all] [package...]',
    '  node build/index.js schedule add-build-package-job',
    '  node build/index.js queue-cli <command> [options]',
    '  node build/index.js health [queue...]',
    '  node build/index.js --help',
    '',
    'Service commands:',
    '  process <queue>',
    '    Run a BullMQ worker for a queue. Queue is usually "pkg" or "rel".',
    '',
    '  add-build-package-job [--all] [package...]',
    '    Enqueue package scan jobs. Use --all for all known packages, or pass',
    '    one or more package names such as com.foo.bar.',
    '',
    '  schedule add-build-package-job',
    '    Run the internal scheduler that periodically enqueues package scan jobs.',
    '',
    '  queue-cli <command>',
    '    Run operator commands for queue/release inspection and repair.',
    '    Use "node build/index.js queue-cli --help" for details.',
    '',
    '  health [queue...]',
    '    Verify BullMQ/Redis access for one or more queues without mutating jobs.',
  ].join('\n');
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    return { command: 'help' };
  }

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

  if (command === 'queue-cli') return { command };

  if (command === 'health') return { command, queueNames: args.slice(1) };

  throw new Error(getUsage());
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
  if (parsed.command === 'help') {
    console.log(getUsage());
    return;
  }

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

  if (parsed.command === 'queue-cli') {
    try {
      await runQueueCli(process.argv);
    } catch (err) {
      console.error((err as Error).message);
      process.exitCode = 1;
    }
    return;
  }

  if (parsed.command === 'health') {
    await runQueueHealthcheck(parsed.queueNames);
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

export {
  main,
  parseArgs,
  getUsage,
  runAddBuildPackageJob,
  scheduleAddBuildPackageJob,
};
