<!-- The `WideLayout` component increases the width of the theme-default-content section. -->
<script setup lang="ts">
import ParentLayout from '@/layouts/Layout.vue'
</script>

<template>
  <ParentLayout class="wide-layout" />
</template>

<style lang="scss">
.wide-layout {
  .theme-container {
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
}
</style>
