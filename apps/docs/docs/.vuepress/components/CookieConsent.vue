<script setup lang="ts">
import { getLocaleDocsPath } from '@openupm/common/build/urls.js';
import { capitalize } from 'lodash-es';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const initCookieConsent = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieconsent = (window as any).cookieconsent;
  if (cookieconsent === undefined) {
    console.error("Cookie Consent script not loaded yet.");
    return;
  }
  if (cookieconsent.inited) return;
  cookieconsent.initialise({
    palette: {
      popup: {
        background: "#3937a3"
      },
      button: {
        background: "#a31c54"
      }
    },
    content: {
      message: t("cookie-consent-message"),
      dismiss: t("cookie-consent-dismiss"),
      link: capitalize(t("learn-more"),),
      href: getLocaleDocsPath("/docs/privacy")
    },
  });
  cookieconsent.inited = true;
}

onMounted(() => { initCookieConsent(); });
</script>

<template>
  <div class="cookie-consent-init"></div>
</template>

<i18n locale="en-US" lang="yaml">
  cookie-consent-dismiss: Got it!
  cookie-consent-message: We use cookies to optimize your experience on our website and provide relevant content and ads.
</i18n>

<i18n locale="zh-CN" lang="yaml">
  cookie-consent-dismiss: 好的
  cookie-consent-message: 我们使用cookies来优化您在我们网站上的体验并提供相关的内容和广告。
</i18n>