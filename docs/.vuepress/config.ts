import _ from "lodash";
import { defaultTheme } from 'vuepress'
import { getDirname, path } from "@vuepress/utils";
import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { viteBundler } from '@vuepress/bundler-vite'
import vueI18nPlugin from './plugins/plugin-vue-i18n';

const __dirname = getDirname(import.meta.url)

const OPENUPM_REGION = process.env.OPENUPM_REGION == "cn" ? "cn" : "us";
const BASE_DOMAIN = OPENUPM_REGION == "cn" ? "openupm.cn" : "openupm.com";
import * as configUs from "./config-us";
import * as configCn from "./config-cn";
const regionConfig: any = OPENUPM_REGION == "cn" ? configCn : configUs;
const THEME_COLOR = "#3068E5";

// Merge customizer to concat arrays
const mergeCustomizer = (obj, src) => { if (_.isArray(obj)) return obj.concat(src); };

// Merge themeConfig with regionConfig.themeConfig
const themeConfig: any = _.mergeWith({
  baseDomain: BASE_DOMAIN,
  domain: `https://${BASE_DOMAIN}`,
  region: OPENUPM_REGION,
  // repo: "https://github.com/openupm/openupm",
  docsRepo: "https://github.com/openupm/openupm-frontend",
  docsDir: "docs",
  editLinks: true,
  logo: "/images/openupm-icon-256.png",
  lastUpdated: false,
  smoothScroll: true,
}, regionConfig.themeConfig, mergeCustomizer);

// Merge config with regionConfig.config
const config: any = _.mergeWith({
  theme: defaultTheme(themeConfig),
  head: [
    ["meta", { name: "theme-color", content: THEME_COLOR }],
    ["link", { rel: "icon", href: "/images/openupm-icon-256.png" }],
    ["link", { rel: "mask-icon", href: "/images/openupm-icon-mask.svg", color: THEME_COLOR }],
    ["link", { rel: "apple-touch-icon", href: "/images/openupm-icon-256.png" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "msapplication-TileImage", content: "/images/openupm-icon-256.png" }],
    ["meta", { name: "msapplication-TileColor", content: "#000000" }],
    ["link", { rel: "manifest", href: "/manifest.json" }],
    ["link", { rel: "stylesheet", href: "/vendors/fontawesome-free@5.15.1/css/all.css" }],
    ["link", { rel: "stylesheet", href: "/vendors/cookieconsent@3.1.1/build/cookieconsent.min.css" }],
    ["link", { rel: "alternate", type: "application/rss+xml", href: `https://api.${BASE_DOMAIN}/feeds/updates/rss` }],
    ["link", { rel: "alternate", type: "application/rss+atom", href: `https://api.${BASE_DOMAIN}/feeds/updates/atom` }],
    ["link", { rel: "alternate", type: "application/json", href: `https://api.${BASE_DOMAIN}/feeds/updates/json` }],
  ],
  plugins: [
    vueI18nPlugin({ locales: [regionConfig.config.lang], localeDir: path.resolve(__dirname, "./locales") }),
    registerComponentsPlugin({ componentsDir: path.resolve(__dirname, "./components") }),
  ],
  alias: {
    '@': path.resolve(__dirname),
    // https://github.com/intlify/vue-i18n-next/issues/789
    'vue-i18n': 'vue-i18n/dist/vue-i18n.esm-browser.prod.js',
  },
  shouldPrefetch: false,
  bundler: viteBundler({
    viteOptions: {
      css: {
        preprocessorOptions: {
          scss: { quietDeps: true }
        }
      }
    },
  }),
}, regionConfig.config, mergeCustomizer);

export default config;
