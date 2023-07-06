<script setup lang="ts">
import { ListLoader } from 'vue-content-loader';
import { useDarkMode } from '@vuepress/theme-default/lib/client/composables/index.js';
import { computed } from 'vue';

const isDarkMode = useDarkMode();
const primaryColor = computed(() => isDarkMode.value ? '#2c2c2c' : '#f9f9f9');
const secondaryColor = computed(() => isDarkMode.value ? '#6c6c6c' : '#ecebeb');
</script>

<template>
  <ListLoader :primaryColor="primaryColor" :secondaryColor="secondaryColor" />
</template>