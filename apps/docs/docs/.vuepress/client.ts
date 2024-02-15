import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { createI18n } from "vue-i18n";
import { defineClientConfig } from "vuepress/client";
import messages from "@intlify/unplugin-vue-i18n/messages";
import { Breakpoints, Vue3Mq } from "vue3-mq";
import ScriptX from "vue-scriptx";

import { useDefaultStore } from "@/store";
import { GlobalFilters } from "@/vue-plugins/global-filters";
import Layout from "@/layouts/Layout.vue";
import WideLayout from "@/layouts/WideLayout.vue";
import PackageDetailLayout from "@/layouts/PackageDetailLayout.vue";
import PackageListLayout from "@/layouts/PackageListLayout.vue";
import PackageAddLayout from "@/layouts/PackageAddLayout.vue";
import HomeLayout from "@/layouts/HomeLayout.vue";

export default defineClientConfig({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enhance({ app, router, siteData }) {
    // common-filters
    app.use(GlobalFilters);
    // vue-i18n
    const i18n = createI18n({
      allowComposition: true,
      locale: siteData.value.lang,
      fallbackLocale: "en-US",
      messages,
    });
    app.use(i18n);
    // pinia
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    app.use(pinia);
    // vue3-mq
    const breakpoints: Breakpoints = {
      // Vuepress-next breakpoints
      xs: 0,
      sm: 481,
      md: 601,
      lg: 841,
      xl: 961,
      xxl: 1281,
    };
    app.use(Vue3Mq, { breakpoints });
    // vue-scriptx
    app.use(ScriptX);
    // hide NavbarSearch component
    app.component("NavbarSearch", () => {
      return null;
    });
    /* Register router error handler to handle dynamically imported module fetch error.
     * But there is no way to tell if the user is offline or the website get redeployed.
     * As a trade-off we just refresh the page when the error happens.
     */
    router.onError((err) => {
      console.error(err);
      if (/Failed to fetch dynamically imported module/.test(err.message)) {
        window.location.href = window.location.href;
      }
    });
  },
  setup() {
    const fetchSiteData = (): void => {
      const store = useDefaultStore();
      store.fetchCachedSiteInfo();
      store.fetchCachedPackageMetadataRemoteDict();
      store.fetchCachedPackageMetadataLocalList();
    };
    onMounted(() => fetchSiteData());
    const route = useRoute();
    watch(
      () => route.path,
      () => fetchSiteData(),
    );
  },
  layouts: {
    Layout,
    WideLayout,
    PackageDetailLayout,
    PackageListLayout,
    PackageAddLayout,
    HomeLayout,
  },
});
