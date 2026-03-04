import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const setupEnvFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  './setup-env.js',
);

const nodeConfig = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [setupEnvFile],
    threads: false,
  },
});

export default nodeConfig;
