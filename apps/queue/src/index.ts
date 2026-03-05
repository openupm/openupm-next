import { createLogger } from '@openupm/server-common/build/log.js';

import {
  addBuildPackageJobs,
  getPackageNamesFromArgs,
} from './jobs/addBuildPackageJob.js';
import { dispatch } from './queues/process.js';

const logger = createLogger('@openupm/queue');

type ParsedArgs =
  | { command: 'process'; queueName: string }
  | { command: 'add-build-package-job'; all: boolean; names: string[] };

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

  throw new Error(
    'Usage: process <queue> | add-build-package-job [--all] [name...]',
  );
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);
  if (parsed.command === 'process') {
    await dispatch(parsed.queueName);
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

export { main, parseArgs };
