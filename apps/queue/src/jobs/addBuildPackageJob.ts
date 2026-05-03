import configRaw from 'config';

import {
  loadPackageNames,
  packageMetadataLocalExists,
} from '@openupm/local-data';
import { createLogger } from '@openupm/server-common/build/log.js';

import { addJob, getQueue } from '../queues/core.js';
import { createJobId } from '../queues/jobId.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/queue/addBuildPackageJob');

export async function addBuildPackageJobs(packageNames: string[]): Promise<void> {
  const jobConfig = config.jobs.buildPackage;
  const queue = getQueue(jobConfig.queue);

  for (const name of packageNames) {
    if (!packageMetadataLocalExists(name)) {
      logger.error({ pkg: name }, "package doesn't exist");
      continue;
    }

    const jobId = createJobId(jobConfig.name, name);
    await addJob({
      queue,
      name: jobConfig.name,
      data: { name },
      opts: { jobId },
    });
  }
}

export async function getPackageNamesFromArgs(args: {
  all: boolean;
  names: string[];
}): Promise<string[]> {
  if (args.all) {
    return await loadPackageNames({ sortKey: '-mtime' });
  }
  return args.names;
}
