<script setup lang="ts">
import { computed, PropType, useAttrs } from 'vue'
import { RouteLink, useRoute, useSiteData } from '@vuepress/client';

defineOptions({
  inheritAttrs: false,
});

interface AutoLinkItem {
  text: string;
  ariaLabel?: string;
  link: string;
  rel?: string;
  target?: string;
  activeMatch?: string;
  exact?: boolean;
  class?: unknown;
  className?: unknown;
  icon?: string;
  iconLeft?: boolean;
  iconRight?: boolean;
}

const attrs = useAttrs()
const route = useRoute()
const siteData = useSiteData()

const props = defineProps({
  item: {
    type: Object as PropType<AutoLinkItem>,
    required: false,
    default: undefined,
  },
  config: {
    type: Object as PropType<AutoLinkItem>,
    required: false,
    default: undefined,
  },
})

const linkConfig = computed(() => props.item ?? props.config)

const passThroughAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.class;
  return rest;
})

const linkClass = computed(() => [
  attrs.class,
  linkConfig.value?.class,
  linkConfig.value?.className,
])

const withProtocol = computed(() => {
  return /^[a-z][a-z0-9+.-]*:/i.test(linkConfig.value?.link ?? '');
})

const linkTarget = computed(() => {
  return linkConfig.value?.target || (withProtocol.value ? "_blank" : undefined);
})

const isBlankTarget = computed(() => linkTarget.value === "_blank")

const isInternal = computed(() => !withProtocol.value && !isBlankTarget.value)

const linkRel = computed(() => {
  return linkConfig.value?.rel || (isBlankTarget.value ? "noopener noreferrer" : undefined);
})

const linkAriaLabel = computed(() => linkConfig.value?.ariaLabel ?? linkConfig.value?.text)

const shouldBeActiveInSubpath = computed(() => {
  if (!linkConfig.value || linkConfig.value.exact) return false;
  const localePaths = Object.keys(siteData.value.locales);
  return localePaths.length
    ? localePaths.every(key => key !== linkConfig.value?.link)
    : linkConfig.value.link !== "/";
})

const isActive = computed(() => {
  if (!isInternal.value || !linkConfig.value) return false;
  if (linkConfig.value.activeMatch) {
    return new RegExp(linkConfig.value.activeMatch, "u").test(route.path);
  }
  if (shouldBeActiveInSubpath.value) return route.path.startsWith(linkConfig.value.link);
  return route.path === linkConfig.value.link;
})

const showLeftIcon = computed(() => {
  return linkConfig.value?.icon && linkConfig.value.iconLeft;
})

const showRightIcon = computed(() => {
  return linkConfig.value?.icon && !linkConfig.value.iconLeft;
})
</script>

<template>
  <RouteLink
    v-if="linkConfig && isInternal"
    v-bind="passThroughAttrs"
    class="auto-link"
    :class="linkClass"
    :to="linkConfig.link"
    :active="isActive"
    :aria-label="linkAriaLabel"
  >
    <i v-if="showLeftIcon" :class="linkConfig.icon" aria-hidden="true"></i>
    {{ linkConfig.text }}
    <i v-if="showRightIcon" :class="linkConfig.icon" aria-hidden="true"></i>
  </RouteLink>
  <a
    v-else-if="linkConfig"
    v-bind="passThroughAttrs"
    class="auto-link external-link"
    :class="linkClass"
    :href="linkConfig.link"
    :aria-label="linkAriaLabel"
    :rel="linkRel"
    :target="linkTarget"
  >
    <i v-if="showLeftIcon" :class="linkConfig.icon" aria-hidden="true"></i>
    {{ linkConfig.text }}
    <i v-if="showRightIcon" :class="linkConfig.icon" aria-hidden="true"></i>
  </a>
</template>

<style lang="scss" scoped>
a>i {
  margin-right: 0.2rem;
}
</style>
