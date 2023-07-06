<script setup lang="ts">
import { computed } from 'vue';

import AutoLink from '@theme/AutoLink.vue'
import { getPackageDetailPagePath } from '@shared/urls';

const props = defineProps({
  relatedPackages: {
    type: Array<{ name: string, text: string }>,
    required: true
  }
});

const relatedPackageEntries = computed(() => {
  return props.relatedPackages.map(x => {
    return {
      name: x.name,
      link: {
        text: x.text,
        link: getPackageDetailPagePath(x.name)
      },
      icon: "fa fa-box-open text-primary"
    };
  });
});
</script>

<template>
  <div class="subpage-pipelines">
    <h2>
      {{ $capitalize($t("related-packages")) }}
      <sup>{{ relatedPackages.length }}</sup>
    </h2>
    <section v-if="relatedPackages.length">
      <table class="table">
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
    </section>
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