#!/usr/bin/env node
import * as esbuild from 'esbuild';

const build = async () => {
  const options = {
    entryPoints: ['src/node/vuepress-plugin-openupm.ts'],
    bundle: true,
    outdir: 'dist',
    format: "esm",
    target: "es2022",
    platform: "node",
    // https://github.com/evanw/esbuild/issues/1921#issuecomment-1491470829
    banner: {
      js: `import { createRequire as topLevelCreateRequire } from 'module'; const require = topLevelCreateRequire(import.meta.url);`
    },
  };
  const isWatchMode = process.argv.includes('--watch');
  if (isWatchMode) {
    const context = await esbuild.context(options);
    await context.watch();
  } else {
    await esbuild.build(options);
  }
};

// Run as main module
if (import.meta.url === `file://${process.argv[1]}`) build();