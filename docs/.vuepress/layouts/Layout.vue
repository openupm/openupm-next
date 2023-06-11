<script setup lang="ts">
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue'
import InitialLoading from '../components/InitialLoading.vue';
</script>

<template>
  <ParentLayout>
    <template #navbar-before>
      <InitialLoading />
    </template>
  </ParentLayout>
</template>

<style lang="scss">
@use '@/styles/palette' as p;
</style>
