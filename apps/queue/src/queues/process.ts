import configRaw from 'config';
import { Job, Worker } from 'bullmq';

import { createLogger } from '@openupm/server-common/build/log.js';

import { getWorker, hasQueue } from './core.js';
import { buildPackage } from '../workers/buildPackage.js';
import { buildRelease } from '../workers/buildRelease.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/queue/process');
const defaultJobTimeoutMs = 60000;

function getConfigJobTimeoutMs(jobName: string): number {
  if (jobName === config.jobs.buildPackage.name) {
    return config.jobs.buildPackage.timeout || defaultJobTimeoutMs;
  }
  if (jobName === config.jobs.buildRelease.name) {
    return config.jobs.buildRelease.timeout || defaultJobTimeoutMs;
  }
  return defaultJobTimeoutMs;
}

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
    await runWithJobTimeout(job, processJob);
  } catch (err) {
    logger.error({ jobId: job.id, name: job.name, err }, 'job failed with error');
    throw err;
  }
}

export async function runWithJobTimeout(
  job: Pick<Job, 'name' | 'id'>,
  processor: (job: Job) => Promise<void>,
): Promise<void> {
  const timeoutMs = getConfigJobTimeoutMs(job.name);
  let timeout: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      processor(job as Job),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(
            new Error(
              `Job ${job.name}${job.id ? ` ${job.id}` : ''} timed out after ${timeoutMs}ms`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export { getConfigJobTimeoutMs };

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
