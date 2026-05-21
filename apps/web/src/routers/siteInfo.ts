import { FastifyInstance } from 'fastify';

import {
  getReadyPackageCount,
  getStars,
} from '@openupm/server-common/build/models/siteInfo.js';

export default function router(server: FastifyInstance): void {
  server.get('/site/info', async function () {
    const [stars, readyPackageCount] = await Promise.all([
      getStars(),
      getReadyPackageCount(),
    ]);
    const data = {
      stars,
      readyPackageCount,
    };
    return data;
  });
}
