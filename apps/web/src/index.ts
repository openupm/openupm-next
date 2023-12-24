import config from 'config';
import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

import createLogger from '@openupm/server-common/build/log.js';
import redis from '@openupm/server-common/build/redis.js';

// Logger init
const logger = createLogger('api');

// Touch the redis.client property to prepare the connection as soon as possible
redis.client;

const app: Express = express();

// Restful
app.use(bodyParser.json());
app.use(function (req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header(
    'Access-Control-Allow-Headers',
    'Accept,Authorization,Content-Type,X-Requested-With,Range,Origin',
  );
  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
});

// Index
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'OpenUPM API Server' });
});

app.listen(config.port, () => {
  logger.info(`Server is running at http://localhost:${config.port}`);
});

// const packagesView = require("./views/packagesView");
// const adsView = require("./views/adsView");
// const feedsView = require("./views/feedsView");
// const siteView = require("./views/siteView");
// const redis = require("./db/redis");

// // Routers
// app.use("/packages/", packagesView);
// app.use("/ads/", adsView);
// app.use("/feeds/", feedsView);
// app.use("/site/", siteView);

// module.exports = { app };
