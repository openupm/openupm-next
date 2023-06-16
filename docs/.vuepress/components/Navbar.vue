<script setup lang="ts">
import ParentComponent from '@vuepress/theme-default/components/Navbar.vue';
import GrowthNavbar from '../components/GrowthNavbar.vue';
import GrowthNavbarMobile from '../components/GrowthNavbarMobile.vue';
import InitialLoading from '../components/InitialLoading.vue';

defineEmits<{ (e: 'toggle-sidebar'): void }>()
</script>

<template>
  <ParentComponent @toggle-sidebar="$emit('toggle-sidebar')">
    <template #after>
      <InitialLoading />
      <GrowthNavbar />
    </template>
  </ParentComponent>
  <GrowthNavbarMobile />
</template>

<style lang="scss" scoped></style>
