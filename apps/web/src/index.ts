import config from 'config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

import createLogger from '@openupm/server-common/build/log.js';
import redis from '@openupm/server-common/build/redis.js';
import adsRouter from './routers/ads.js';
import feedsRouter from './routers/feeds.js';
import siteInfoRouter from './routers/siteInfo.js';
import packagesRouter from './routers/packages.js';

// Logger init
const logger = createLogger('apiserver');

// Touch the redis.client property to prepare the connection as soon as possible
redis.client;

// Create server
const server: FastifyInstance = Fastify({
  logger: true,
});

// Cors
await server.register(cors, {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders:
    'Accept,Authorization,Content-Type,X-Requested-With,Range,Origin',
  exposedHeaders: 'Content-Length',
  credentials: true,
});

// Index
server.get('/', () => {
  return { message: 'OpenUPM API Server' };
});

// Routers
adsRouter(server);
feedsRouter(server);
siteInfoRouter(server);
packagesRouter(server);

// Start server
server.listen({ port: config.port }, () => {
  logger.info(`Server is running at http://localhost:${config.port}`);
});

// const packagesView = require("./views/packagesView");
// const siteView = require("./views/siteView");
