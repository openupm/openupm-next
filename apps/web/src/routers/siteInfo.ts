import { FastifyInstance } from 'fastify';

import { getStars } from '@openupm/server-common/build/models/siteInfo.js';

export default function router(server: FastifyInstance): void {
  server.get('/site/info', async function () {
    const stars = await getStars();
    const data = {
      stars,
    };
    return data;
  });
}
