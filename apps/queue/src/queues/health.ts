import { closeQueues, getQueue, hasQueue } from './core.js';

export async function checkQueueHealth(queueNames: string[]): Promise<void> {
  for (const queueName of queueNames) {
    if (!hasQueue(queueName)) {
      throw new Error(`Can not recognize settings for queue name=${queueName}.`);
    }

    const queue = getQueue(queueName);
    await queue.waitUntilReady();
    await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
  }
}

export async function runQueueHealthcheck(queueNames: string[]): Promise<void> {
  const names = queueNames.length > 0 ? queueNames : ['pkg', 'rel'];
  try {
    await checkQueueHealth(names);
  } finally {
    await closeQueues();
  }
}
