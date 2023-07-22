<script setup lang="ts">
import { computed } from 'vue';

import AutoLink from '@/components/AutoLink.vue'
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import { getPackageDetailPagePath } from '@shared/urls';
import { PackageMetadataLocal } from '@shared/types';

const props = defineProps({
  relatedPackages: {
    type: Array<PackageMetadataLocal>,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: true
  }
});

const relatedPackageEntries = computed(() => {
  return props.relatedPackages.map(x => {
    return {
      name: x.name,
      link: {
        text: x.displayName || x.name,
        link: getPackageDetailPagePath(x.name)
      },
      icon: "fa fa-box-open text-primary"
    };
  });
});
</script>

<template>
  <div v-if="isLoading">
    <PlaceholderLoader />
  </div>
  <div v-else class="subpage-pipelines">
    <h2>
      {{ $capitalize($t("related-packages")) }}
      <sup>{{ relatedPackages.length }}</sup>
    </h2>
    <table v-if="relatedPackages.length" class="table">
      <thead>
        <tr>
          <th class="td-icon"></th>
          <th>{{ $capitalize($t("display-name")) }}</th>
          <th>{{ $capitalize($t("name")) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in relatedPackageEntries" :key="entry.name">
          <td>
            <i :class="entry.icon"></i>
          </td>
          <td class="td-display-name">
            <AutoLink :item="entry.link" />
          </td>
          <td class="td-name">{{ entry.name }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.subpage-pipelines {
  .table {
    .td-icon {
      width: 1rem;
    }

    .td-name {
      word-break: break-all;
    }
  }
}
</style>