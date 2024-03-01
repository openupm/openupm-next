<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { addAdsenseInArticleAds } from '@/adsense';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  content: {
    type: String,
    default: ""
  }
});

// The reference of the readme container element
const readmeContainerElement = ref<HTMLElement | null>(null);

onMounted(() => {
  const element = readmeContainerElement.value;
  if (element)
    addAdsenseInArticleAds(element);
});
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="readmeContainerElement" v-html="content"></div>
</template>
