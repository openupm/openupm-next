<script setup lang="ts">
import ParentComponent from '@vuepress/theme-default/components/Navbar.vue';
import GrowthNavbar from '../components/GrowthNavbar.vue';
import InitialLoading from '../components/InitialLoading.vue';
</script>

<template>
  <ParentComponent>
    <template #after>
      <InitialLoading />
      <GrowthNavbar />
    </template>
  </ParentComponent>
</template>

<style lang="scss" scoped></style>
