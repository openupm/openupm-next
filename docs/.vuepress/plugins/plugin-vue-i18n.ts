// This plugin injects the __VUE_I18N_MESSAGES__ global variable into client.ts to provide messages for vue-i18n.
import * as fs from 'fs';
import yaml from 'js-yaml';
import { path } from "@vuepress/utils";

export default (options) => {
  if (!options.locales || !options.localeDir)
    throw new Error('[vue-i18n] You must specify both locales and localeDir of options.');
  const localeMessages = {};
  for (const locale of options.locales) {
    const localeFile = path.resolve(options.localeDir, `./${locale}.yml`);
    const content = yaml.load(fs.readFileSync(localeFile, "utf8"));
    localeMessages[locale] = content;
  }
  return {
    name: 'vuepress-plugin-vuei18n',
    define: {
      __VUE_I18N_MESSAGES__: localeMessages,
    },
  }
}