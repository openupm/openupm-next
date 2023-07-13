<script setup lang="ts">
import { useI18n } from "vue-i18n";
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import AutoLink from '@/components/AutoLink.vue'

const { t } = useI18n();

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
      <div v-if="readmeHtml" v-html="readmeHtml"></div>
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