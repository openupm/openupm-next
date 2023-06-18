import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import { createI18n } from 'vue-i18n';
import { defineClientConfig } from '@vuepress/client'
import messages from '@intlify/unplugin-vue-i18n/messages'

import { GlobalFilters } from '@/vue-plugins/global-filters';
import Layout from '@/layouts/Layout.vue'
import { useDefaultStore } from '@/store';

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    // common-filters
    app.use(GlobalFilters);
    // vue-i18n
    const i18n = createI18n({
      allowComposition: true,
      locale: siteData.value.lang,
      fallbackLocale: 'en-US',
      messages
    });
    app.use(i18n);
    // pinia
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
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
