<!-- Wrap default theme layout -->
<script setup lang="ts">
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue';
</script>

<template>
  <ParentLayout>
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </ParentLayout>
</template>