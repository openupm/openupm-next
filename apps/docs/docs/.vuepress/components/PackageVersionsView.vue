<script setup lang="ts">
import { PackageVersionViewEntry } from "@openupm/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      <sup>{{ versions.length }}</sup>
    </h2>
    <table v-if="versions.length" class="table">
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
  </div>
</template>

<style lang="scss" scoped>
// @use '@/styles/palette' as *;
</style>
