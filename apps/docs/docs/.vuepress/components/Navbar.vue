<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { RouteLink } from 'vuepress/client';

import ParentComponent from '@vuepress/theme-default/components/VPNavbar.vue';
import MySearchBox from '@/components/MySearchBox';

defineEmits<{ (e: 'toggle-sidebar'): void }>()
</script>

<template>
  <ParentComponent @toggle-sidebar="$emit('toggle-sidebar')">
    <template #before>
      <MySearchBox />
      <div class="navbar-items vp-navbar-items can-hide mr-2">
        <div class="nav-item vp-navbar-item packages-add">
          <RouteLink to="/packages/add/" class="auto-link nav-link">
            <i class="fas fa-plus-circle" aria-hidden="true"></i>
          </RouteLink>
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
