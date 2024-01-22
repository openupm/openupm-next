import config from 'config';

import createLogger from '@openupm/server-common/build/log.js';
import { app } from './apiServer.js';

// Logger init
const logger = createLogger('apiserver');

// Start server
app.listen(
  {
    host: '0.0.0.0',
    port: config.port,
  },
  () => {
    logger.info(`Server is running at http://localhost:${config.port}`);
  },
);
