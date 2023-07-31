<script setup lang="ts">
import ParentComponent from '@vuepress/theme-default/components/Navbar.vue';
import MySearchBox from '@/components/MySearchBox';

defineEmits<{ (e: 'toggle-sidebar'): void }>()
</script>

<template>
  <ParentComponent @toggle-sidebar="$emit('toggle-sidebar')">
    <template #before>
      <MySearchBox />
      <div class="navbar-items can-hide mr-2">
        <div class="nav-item packages-add">
          <a href="/packages/add/" class="nav-link">
            <i class="fas fa-plus-circle"></i>
          </a>
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
