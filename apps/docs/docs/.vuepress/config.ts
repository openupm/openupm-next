import urlJoin from "url-join";
import { isArray, mergeWith } from "lodash-es";
import { defaultTheme } from "vuepress";
import { getDirname, path } from "@vuepress/utils";
import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { searchPlugin } from "@vuepress/plugin-search";
import { viteBundler } from "@vuepress/bundler-vite";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { seoPlugin } from "vuepress-plugin-seo2";
import { sitemapPlugin } from "vuepress-plugin-sitemap2";
import { mediumZoomPlugin } from "@vuepress/plugin-medium-zoom";

import OpenupmPlugin from "vuepress-plugin-openupm";
import { Region } from "@openupm/types";

const __dirname = getDirname(import.meta.url);

// Region
const VITE_OPENUPM_REGION =
  process.env.VITE_OPENUPM_REGION == Region.CN ? Region.CN : Region.US;
import configUs from "./config-us";
import configCn from "./config-cn";
const regionConfig: any =
  VITE_OPENUPM_REGION == Region.CN ? configCn : configUs;

// Page patterns https://v2.vuepress.vuejs.org/reference/config.html#pagepatterns
const pagePatterns = ["**/*.md", "!.vuepress", "!node_modules"];
if (VITE_OPENUPM_REGION != Region.CN) {
  pagePatterns.push("!zh/*.md");
  pagePatterns.push("!zh/**/*.md");
}

// Theme color
const THEME_COLOR = "#3068E5";

// Merge customizer to concat arrays
const mergeCustomizer = (obj: any, src: any) => {
  if (isArray(obj)) return obj.concat(src);
};

// Merge themeConfig with regionConfig.themeConfig
const themeConfig: any = mergeWith(
  {
    // Default theme configurations
    // https://v2.vuepress.vuejs.org/reference/default-theme/config.html
    docsRepo: "https://github.com/openupm/openupm-next",
    docsDir: "docs",
    editLinks: true,
    logo: "/images/openupm-icon-256.png",
    lastUpdated: false,
    contributors: false,
    themePlugins: {
      git: false,
      mediumZoom: true,
    },
  },
  regionConfig.themeConfig,
  mergeCustomizer,
);

// Merge config with regionConfig.config
const config: any = mergeWith(
  {
    pagePatterns,
    theme: defaultTheme(themeConfig),
    head: [
      ["meta", { name: "theme-color", content: THEME_COLOR }],
      ["link", { rel: "icon", href: "/images/openupm-icon-256.png" }],
      [
        "link",
        {
          rel: "mask-icon",
          href: "/images/openupm-icon-mask.svg",
          color: THEME_COLOR,
        },
      ],
      [
        "link",
        { rel: "apple-touch-icon", href: "/images/openupm-icon-256.png" },
      ],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      [
        "meta",
        { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      ],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      [
        "meta",
        {
          name: "msapplication-TileImage",
          content: "/images/openupm-icon-256.png",
        },
      ],
      ["meta", { name: "msapplication-TileColor", content: "#000000" }],
      ["link", { rel: "manifest", href: "/manifest.json" }],
      [
        "link",
        {
          rel: "stylesheet",
          href: "/vendors/fontawesome-free@5.15.1/css/all.css",
        },
      ],
      [
        "link",
        {
          rel: "stylesheet",
          href: "/vendors/cookieconsent@3.1.1/build/cookieconsent.min.css",
        },
      ],
      [
        "script",
        {
          src: "/vendors/cookieconsent@3.1.1/build/cookieconsent.min.js",
          async: false,
        },
      ],
      [
        "script",
        {
          src: "/vendors/chunkload-redirect/chunkload-redirect.js",
          async: true,
        },
      ],
    ],
    plugins: [
      registerComponentsPlugin({
        componentsDir: path.resolve(__dirname, "./components"),
      }),
      searchPlugin({}),
      OpenupmPlugin(),
      seoPlugin({
        hostname: themeConfig.domain,
        fallBackImage: urlJoin(
          themeConfig.domain,
          "/images/openupm-twitter.png",
        ),
      }),
      sitemapPlugin({
        hostname: themeConfig.domain,
        modifyTimeGetter: (page, app) => {
          return new Date().toISOString();
        },
      }),
      mediumZoomPlugin({
        selector:
          ".theme-container:not(.package-list) .theme-default-content :not(a) > img",
      }),
    ],
    alias: {
      "@": path.resolve(__dirname),
      "@node_modules": path.resolve(__dirname, "../../../../node_modules"),
      "@theme/AutoLink.vue": path.resolve(__dirname, "components/AutoLink.vue"),
      "@theme/Navbar.vue": path.resolve(__dirname, "components/Navbar.vue"),
      // https://github.com/intlify/vue-i18n-next/issues/789
      "vue-i18n": "vue-i18n/dist/vue-i18n.esm-browser.prod.js",
    },
    markdown: {
      code: {
        lineNumbers: false,
      },
    },
    shouldPrefetch: false,
    bundler: viteBundler({
      viteOptions: {
        define: {
          "process.env": {
            VITE_OPENUPM_REGION:
              process.env.VITE_OPENUPM_REGION !== undefined
                ? `"${process.env.VITE_OPENUPM_REGION}"`
                : undefined,
          },
        },
        css: {
          preprocessorOptions: {
            scss: { quietDeps: true },
          },
        },
        plugins: [
          VueI18nPlugin({
            // locale messages resource pre-compile option
            include: [path.resolve(__dirname, "./locales/**")],
          }),
          visualizer({
            template: "treemap", // or sunburst
            open: false,
            gzipSize: true,
            brotliSize: true,
            filename: "bundle-analyse.html", // will be saved in project's root
          }),
        ],
        ssr: {
          noExternal: ["vue-i18n"],
        },
      },
    }),
  },
  regionConfig.config,
  mergeCustomizer,
);

export default config;
