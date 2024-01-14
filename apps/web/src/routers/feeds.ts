import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { getFeedRecentUpdate } from '@openupm/server-common/build/models/packageFeed.js';

export default function router(server: FastifyInstance): void {
  server.get(
    '/feeds/updates/rss',
    async function (_req: FastifyRequest, res: FastifyReply) {
      const data = await getFeedRecentUpdate('rss2');
      res.header('Content-Type', 'application/rss+xml');
      res.send(data);
    },
  );

  server.get(
    '/feeds/updates/atom',
    async function (_req: FastifyRequest, res: FastifyReply) {
      const data = await getFeedRecentUpdate('atom1');
      res.header('Content-Type', 'application/atom+xml');
      res.send(data);
    },
  );

  server.get('/feeds/updates/json', async function () {
    const data = await getFeedRecentUpdate('json1');
    return data;
  });
}
