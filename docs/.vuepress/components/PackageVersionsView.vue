<script setup lang="ts">
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import { PackageVersionViewEntry } from "@shared/types";

const props = defineProps({
  versions: {
    type: Array<PackageVersionViewEntry>,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <div v-if="isLoading">
    <PlaceholderLoader />
  </div>
  <div v-else class="subpage-versions">
    <h2>
      {{ $capitalize($t("versions")) }}
      <sup v-if="versions.length">{{ versions.length }}</sup>
    </h2>
    <section v-if="versions.length" class="col-12">
      <table class="table">
        <thead>
          <tr>
            <th>{{ $capitalize($t("version")) }}</th>
            <th>{{ $capitalize($t("supported-unity-version")) }}</th>
            <th>{{ $capitalize($t("published-time")) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in versions" :key="entry.version">
            <td>
              {{ entry.version }}
              <sup v-if="entry.latest">latest</sup>
            </td>
            <td>{{ entry.unity }}+</td>
            <td>{{ entry.timeSince }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style lang="scss" scoped>
// @use '@/styles/palette' as *;
</style>
