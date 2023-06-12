<script setup lang="ts">
import { reactive, computed, toRef } from 'vue'
import ParentComponent from '@vuepress/theme-default/components/AutoLink.vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const showLeftIcon = computed(() => {
  return props.item.icon && props.item.iconLeft;
})

const showRightIcon = computed(() => {
  return props.item.icon && !props.item.iconLeft;
})
</script>

<template>
  <ParentComponent :item="item">
    <template #before>
      <i v-if="showLeftIcon" :class="item.icon" aria-hidden="true"></i>
    </template>
    <template #after>
      <i v-if="showRightIcon" :class="item.icon" aria-hidden="true"></i>
    </template>
  </ParentComponent>
</template>

<style lang="scss" scoped>
  a > i {
    margin-right: 0.2rem;
  }
</style>
