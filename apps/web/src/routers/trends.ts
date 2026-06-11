import { FastifyInstance } from 'fastify';

import { getPublicTrends } from '@openupm/server-common/build/models/trends.js';

export default function router(server: FastifyInstance): void {
  server.get('/trends', async function (_request, reply) {
    try {
      const trends = await getPublicTrends();
      if (!trends) {
        reply.code(503);
        return {
          error: 'TrendsUnavailable',
          message: 'Trends are not ready yet.',
        };
      }
      return trends;
    } catch {
      reply.code(503);
      return {
        error: 'TrendsUnavailable',
        message: 'Trends are temporarily unavailable.',
      };
    }
  });
}
