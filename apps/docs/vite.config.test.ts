// The vite.config.ts file is only used to configure vitest.

import { defineConfig } from "vite";
import { getDirname, path } from "@vuepress/utils";
// import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = getDirname(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [tsconfigPaths()],
  // For some reason vite-tsconfig-paths is not working with @alias, so we have to duplicate the alias config here.
  // https://github.com/aleclarson/vite-tsconfig-paths/issues/110
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./docs/.vuepress"),
      "@node_modules": path.resolve(__dirname, "../../node_modules"),
    },
  },
  define: {
    // https://github.com/vuepress/vuepress-next/blob/main/packages/bundler-vite/src/plugins/mainPlugin.ts#L205
    __VUEPRESS_SSR__: true,
  },
});
