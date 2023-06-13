import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useStore } from 'vuex';
import { createI18n } from 'vue-i18n';
import { defineClientConfig, routeLocaleSymbol } from '@vuepress/client'
import { useThemeData } from '@vuepress/plugin-theme-data/client';

import Layout from '@/layouts/Layout.vue'
import { createVuexStore } from '@/store';

// vue-i18n messages provided by plugin-vue-i18n
declare const __VUE_I18N_MESSAGES__: any;
const VUE_I18N_MESSAGES = __VUE_I18N_MESSAGES__;

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    const themeData = useThemeData();
    // vue-i18n
    const i18n = createI18n({
      locale: siteData.value.lang,
      fallbackLocale: 'en-US',
      messages: VUE_I18N_MESSAGES,
    });
    app.use(i18n);
    // vuex
    const store = createVuexStore({ openupmApiUrl: themeData.value.openupmApiUrl });
    app.use(store);
  },
  setup() {
    const fetchSiteData = () => {
      const store = useStore();
      store.dispatch("fetchSiteInfoWithCache");
      store.dispatch("fetchPackagesExtraWithCache");
    };
    onMounted(() => fetchSiteData())
    const route = useRoute();
    watch(() => route.path, () => fetchSiteData())
  },
  layouts: {
    Layout,
  },
})
