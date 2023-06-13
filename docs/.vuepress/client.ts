import { createPinia } from 'pinia'
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import { createI18n } from 'vue-i18n';
import { defineClientConfig } from '@vuepress/client'

import Layout from '@/layouts/Layout.vue'
import { useDefaultStore } from '@/store';

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
    // pinia
    const pinia = createPinia()
    app.use(pinia);
  },
  setup() {
    const fetchSiteData = () => {
      const store = useDefaultStore();
      store.fetchSiteInfoWithCache();
      store.fetchPackagesExtraWithCache();
    };
    onMounted(() => fetchSiteData())
    const route = useRoute();
    watch(() => route.path, () => fetchSiteData())
  },
  layouts: {
    Layout,
  },
})
