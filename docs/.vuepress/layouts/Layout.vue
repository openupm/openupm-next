<!-- The `Layout` component adds a root class name to the default theme's `Layout` component. -->
<script setup lang="ts">
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue'

const props = defineProps({
  classname: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div :class="classname">
    <ParentLayout v-bind="$attrs">
    </ParentLayout>
  </div>
</template>