import { FastifyInstance } from 'fastify';

import redis from '@openupm/server-common/build/redis.js';

export default function router(server: FastifyInstance): void {
  server.get('/ads/custom', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = await redis.client!.hgetall('ad:custom');
    obj.active = Boolean(obj.active && obj.active !== '0');
    return obj;
  });
}
