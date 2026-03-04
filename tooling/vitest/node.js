import { defineConfig } from 'vitest/config';

const nodeConfig = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['dotenv-flow/config'],
    threads: false,
  },
});

export default nodeConfig;
