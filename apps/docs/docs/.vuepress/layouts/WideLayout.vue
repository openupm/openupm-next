<!-- The `WideLayout` component increases the width of the default content section. -->
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
:is(.theme-container, .vp-theme-container).wide-layout {
  main:is(.page, .vp-page) {
    :is(.theme-default-content, [vp-content]) {
      max-width: 100%;
    }
  }

  &:not(.no-sidebar) {
    main:is(.page, .vp-page) {
      max-width: 100%;
    }
  }
}
</style>
