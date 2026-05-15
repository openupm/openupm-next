<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { timeAgoFormat } from '@/utils';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  readmeHtml: {
    type: String,
    default: ""
  },
  readmeUpdatedAt: {
    type: Number,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: true
  }
});

const { t } = useI18n();

const readmeSyncedAgo = computed(() => {
  if (!props.readmeUpdatedAt) return "";
  return timeAgoFormat(new Date(props.readmeUpdatedAt));
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
      <footer v-if="readmeSyncedAgo" class="readme-footer">
        {{ t("readme-synced-ago", { time: readmeSyncedAgo }) }}
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.readme-wrap {
  max-width: 42rem;
}

.readme-footer {
  border-top: 1px solid $border-color;
  color: $gray-color;
  font-size: 0.7rem;
  margin-top: 1.2rem;
  padding-top: 0.6rem;
}
</style>
