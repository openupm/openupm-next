import configRaw from 'config';
import { Job, JobsOptions, Queue, Worker } from 'bullmq';

import { createLogger } from '@openupm/server-common/build/log.js';

const logger = createLogger('@openupm/queue/core');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

const queues: Record<string, Queue> = {};

export function hasQueue(name: string): boolean {
  return config.queueSettings[name] !== undefined;
}

export function getQueue(name: string): Queue {
  if (queues[name] === undefined) {
    const settings = { ...config.queueSettings[name], connection: config.redis };
    queues[name] = new Queue(name, settings);
  }
  return queues[name];
}

export async function closeQueues(): Promise<void> {
  await Promise.all(
    Object.values(queues).map(async (queue) => await queue.close()),
  );
  for (const name of Object.keys(queues)) delete queues[name];
}

export function getWorker(
  name: string,
  jobHandler: (job: Job) => Promise<void>,
): Worker {
  const settings = {
    ...config.queueSettings[name],
    connection: config.redis,
    autorun: false,
  };
  return new Worker(name, jobHandler, settings);
}

export async function addJob(params: {
  queue: Pick<Queue, 'add' | 'getJob'>;
  name: string;
  data?: object;
  opts?: JobsOptions;
}): Promise<Job | null> {
  const { queue, name } = params;
  const data = params.data || {};
  const opts = params.opts || {};

  if (opts.jobId) {
    const existed = await queue.getJob(opts.jobId);
    if (existed) return null;
  }

  const job = await queue.add(name, data, opts);
  logger.info({ jobId: job.id, name, data, opts }, 'new job');
  return job;
}
