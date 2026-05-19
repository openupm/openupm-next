<script setup lang="ts">
import { computed, PropType } from 'vue'
import ParentComponent from '@vuepress/theme-default/components/VPAutoLink.vue';

interface AutoLinkItem {
  text: string;
  ariaLabel?: string;
  link: string;
  rel?: string;
  target?: string;
  activeMatch?: string;
  icon?: string;
  iconLeft?: boolean;
  iconRight?: boolean;
}

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

const showLeftIcon = computed(() => {
  return linkConfig.value?.icon && linkConfig.value.iconLeft;
})

const showRightIcon = computed(() => {
  return linkConfig.value?.icon && !linkConfig.value.iconLeft;
})
</script>

<template>
  <ParentComponent v-if="linkConfig" :config="linkConfig">
    <template #before>
      <i v-if="showLeftIcon" :class="linkConfig.icon" aria-hidden="true"></i>
    </template>
    <template #after>
      <i v-if="showRightIcon" :class="linkConfig.icon" aria-hidden="true"></i>
    </template>
  </ParentComponent>
</template>

<style lang="scss" scoped>
a>i {
  margin-right: 0.2rem;
}
</style>
