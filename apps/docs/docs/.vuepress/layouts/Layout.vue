<!-- eslint-disable vue/multi-word-component-names -->
<!-- Wrap default theme layout -->

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { ClientOnly, usePageFrontmatter } from '@vuepress/client';

import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue';

const frontmatter = usePageFrontmatter();
const attrs = useAttrs();

const showFooter = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (frontmatter.value as any).showFooter === true;
});

const showContentTopAd = computed(() => {
  // The default value of showContentTopAd is true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((frontmatter.value as any).showContentTopAd === undefined) return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (frontmatter.value as any).showContentTopAd === true;
});

const parentLayoutAttrs = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: className, ...rest } = attrs;
  return rest;
});

const parentLayoutClass = computed(() => [
  attrs.class,
  { 'has-page-footer': showFooter.value },
]);
</script>

<template>
  <ParentLayout v-bind="parentLayoutAttrs" :class="parentLayoutClass">
    <template #page-content-top>
      <SiteBreadcrumb />
      <ClientOnly>
        <AdsenseDisplayForContentTop v-if="showContentTopAd" />
      </ClientOnly>
    </template>

    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>

  </ParentLayout>

  <Footer v-if="showFooter" />
  <CookieConsent />
</template>

<style lang="scss">
:is(.theme-container, .vp-theme-container).has-page-footer {
  :is(.page, .vp-page) {
    padding-bottom: 0;
  }
}
</style>
