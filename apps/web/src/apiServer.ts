import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

import redis from '@openupm/server-common/build/redis.js';
import adsRouter from './routers/ads.js';
import feedsRouter from './routers/feeds.js';
import siteInfoRouter from './routers/siteInfo.js';
import packagesRouter from './routers/packages.js';

// Touch the redis.client property to prepare the connection as soon as possible
redis.client;

// Create server
export const app: FastifyInstance = Fastify({
  logger: { level: 'info' },
  disableRequestLogging: true,
});

// Cors
await app.register(cors, {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders:
    'Accept,Authorization,Content-Type,X-Requested-With,Range,Origin',
  exposedHeaders: 'Content-Length',
  credentials: true,
});

// Index
app.get('/', () => {
  return { message: 'OpenUPM API Server' };
});

// Routers
adsRouter(app);
feedsRouter(app);
siteInfoRouter(app);
packagesRouter(app);
