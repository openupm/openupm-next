<script setup lang="ts">
import { capitalize } from 'lodash-es';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const initCookieConsent = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieconsent = (window as any).cookieconsent;
  if (cookieconsent === undefined) {
    return false;
  }
  if (cookieconsent.inited) return true;
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
      href: "/docs/privacy"
    },
  });
  cookieconsent.inited = true;
  return true;
}

onMounted(() => {
  if (initCookieConsent()) return;
  window.addEventListener("load", () => {
    initCookieConsent();
  }, { once: true });
});
</script>

<template>
  <div class="cookie-consent-init"></div>
</template>
