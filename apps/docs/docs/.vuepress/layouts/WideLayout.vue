<!-- The `WideLayout` component increases the width of the theme-default-content section. -->
<script setup lang="ts">
import ParentLayout from '@/layouts/Layout.vue'
</script>

<template>
  <ParentLayout class="wide-layout">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </ParentLayout>
</template>

<style lang="scss">
.theme-container.wide-layout {
  main.page {
    .theme-default-content {
      max-width: 100%;
    }
  }

  &:not(.no-sidebar) {
    main.page {
      max-width: 100%;
    }
  }
}
</style>
