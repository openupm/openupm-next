import configRaw from 'config';
import { Queue, type Job } from 'bullmq';

import { createLogger } from '@openupm/server-common/build/log.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/web/packageRefresh');

const queues: Record<string, Queue> = {};

export interface PackageRefreshResult {
  queue: string;
  jobId: string;
  added: boolean;
}

function createJobId(...parts: string[]): string {
  return parts.map((part) => encodeURIComponent(part)).join('|');
}

function getQueue(name: string): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      ...config.queueSettings[name],
      connection: config.redis,
    });
  }
  return queues[name];
}

async function canReuseExistingJob(job: Job): Promise<boolean> {
  const state = await job.getState();
  if (state !== 'failed') return true;
  await job.remove();
  return false;
}

export async function closePackageRefreshQueues(): Promise<void> {
  await Promise.all(Object.values(queues).map(async (queue) => queue.close()));
  for (const name of Object.keys(queues)) delete queues[name];
}

export async function enqueuePackageRefresh(
  packageName: string,
): Promise<PackageRefreshResult> {
  const jobConfig = config.jobs.buildPackage;
  const queue = getQueue(jobConfig.queue);
  const jobId = createJobId(jobConfig.name, packageName);
  const existing = await queue.getJob(jobId);
  if (existing && (await canReuseExistingJob(existing))) {
    return { queue: jobConfig.queue, jobId, added: false };
  }

  const job = await queue.add(
    jobConfig.name,
    { name: packageName },
    { jobId },
  );
  logger.info({ packageName, jobId: job.id }, 'accepted package refresh');
  return { queue: jobConfig.queue, jobId, added: true };
}
