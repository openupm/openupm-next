import { defineClientConfig } from '@vuepress/client'
import { createI18n } from 'vue-i18n';

import Layout from '@/layouts/Layout.vue'

// vue-i18n messages provided by plugin-vue-i18n
declare const __VUE_I18N_MESSAGES__: any;
const VUE_I18N_MESSAGES = __VUE_I18N_MESSAGES__;

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    // vue-i18n
    const i18n = createI18n({
      locale: siteData.value.lang,
      fallbackLocale: 'en-US',
      messages: VUE_I18N_MESSAGES,
    });
    app.use(i18n);
  },
  layouts: {
    Layout,
  },
})
