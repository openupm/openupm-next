<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  readmeHtml: {
    type: String,
    default: ""
  },
  isLoading: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <div class="readme-wrap">
    <div v-if="isLoading">
      <PlaceholderLoader />
    </div>
    <div v-else>
      <ReadmeHtml v-if="readmeHtml" :content="readmeHtml" />
      <p v-else>{{ $t("readme-to-found") }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.readme-wrap {
  max-width: 42rem;
}
</style>