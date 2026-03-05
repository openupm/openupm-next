import configRaw from 'config';
import { Job, Worker } from 'bullmq';

import { createLogger } from '@openupm/server-common/build/log.js';

import { getWorker, hasQueue } from './core.js';
import { buildPackage } from '../workers/buildPackage.js';
import { buildRelease } from '../workers/buildRelease.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/queue/process');

export async function processJob(job: Job): Promise<void> {
  if (job.name === config.jobs.buildPackage.name) {
    const data = job.data as { name: string };
    await buildPackage(data.name);
  } else if (job.name === config.jobs.buildRelease.name) {
    const data = job.data as { name: string; version: string };
    await buildRelease(data.name, data.version);
  } else {
    logger.error({ jobId: job.id, name: job.name }, 'unknown job name');
  }
}

export async function jobHandler(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'job start');
  try {
    await processJob(job);
  } catch (err) {
    logger.error({ jobId: job.id, name: job.name, err }, 'job failed with error');
    throw err;
  }
}

export async function dispatch(queueName: string): Promise<void> {
  if (!hasQueue(queueName)) {
    throw new Error(`Can not recognize settings for queue name=${queueName}.`);
  }

  const worker: Worker = getWorker(queueName, jobHandler);
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'job completed');
  });
  worker.on('failed', (job) => {
    logger.info({ jobId: job?.id }, 'job failed');
  });
  worker.on('drained', () => {
    logger.info('queue drained');
  });
  await worker.run();
}
