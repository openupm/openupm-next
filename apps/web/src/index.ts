import configRaw from 'config';

import { createLogger } from '@openupm/server-common/build/log.js';
import { app } from './apiServer.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

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
