import { FastifyInstance } from 'fastify';

import {
  buildPublicQueueStatus,
  createQueueStatusCache,
  getQueue,
} from '../status/queueStatus.js';

const CACHE_TTL_SECONDS = 10;

const queueStatusCache = createQueueStatusCache(async (cacheState) => {
  return await buildPublicQueueStatus(
    {
      packageQueue: getQueue('pkg'),
      releaseQueue: getQueue('rel'),
    },
    { cacheState, ttlSeconds: CACHE_TTL_SECONDS },
  );
}, CACHE_TTL_SECONDS);

export function clearQueueStatusCache(): void {
  queueStatusCache.clear();
}

export default function router(server: FastifyInstance): void {
  server.get('/queue/status', async function (_request, reply) {
    try {
      return await queueStatusCache.get();
    } catch {
      reply.code(503);
      return {
        error: 'QueueStatusUnavailable',
        message: 'Queue status is temporarily unavailable.',
      };
    }
  });
}
