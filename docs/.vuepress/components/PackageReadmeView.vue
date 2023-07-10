<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from "vue-i18n";
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import AutoLink from '@/components/AutoLink.vue'

import { getGitHubPackageMetadataUrl } from "@shared/urls";

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

const editNavLink = computed(() => {
  return {
    link: getGitHubPackageMetadataUrl(props.name),
    text: t("edit-metadata")
  };
});
</script>

<template>
  <div class="readme-wrap">
    <ClientOnly>
      <div v-if="isLoading">
        <PlaceholderLoader />
      </div>
      <div v-else>
        <div v-if="readmeHtml" v-html="readmeHtml"></div>
        <p v-else>{{ $t("readme-to-found") }}</p>
      </div>
    </ClientOnly>
    <div class="editlink-wrap">
      <div class="divider"></div>
      <p>
        <AutoLink :item="editNavLink" />
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.readme-wrap {
  max-width: 42rem;
}

.editlink-wrap {
  margin-top: 1rem;
}
</style>

<i18n locale="en-US" lang="yaml">
  edit-metadata: Edit the package metadata
</i18n>

<i18n locale="zh-CN" lang="yaml">
  edit-metadata: 编辑软件包元数据
</i18n>