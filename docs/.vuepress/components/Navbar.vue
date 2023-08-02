<script setup lang="ts">
import { computed } from 'vue';

import ParentComponent from '@vuepress/theme-default/components/Navbar.vue';
import MySearchBox from '@/components/MySearchBox';

const packageAddLink = computed(() => {
  return {
    link: "/packages/add/",
    text: "",
    icon: "fas fa-plus-circle",
    iconLeft: true
  };
});
defineEmits<{ (e: 'toggle-sidebar'): void }>()
</script>

<template>
  <ParentComponent @toggle-sidebar="$emit('toggle-sidebar')">
    <template #before>
      <MySearchBox />
      <div class="navbar-items can-hide mr-2">
        <div class="nav-item packages-add">
          <AutoLink :item="packageAddLink" class="nav-link" />
        </div>
      </div>
    </template>
    <template #after>
      <InitialLoading />
      <GrowthNavbar />
    </template>
  </ParentComponent>
  <GrowthNavbarMobile />
</template>

<style lang="scss" scoped></style>
