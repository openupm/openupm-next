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
            <span v-if="entry.source === 'githubRelease'" class="release-badge tooltip"
              :data-tooltip="$t('github-release-asset-package')">
              <i class="fas fa-paperclip" aria-hidden="true"></i>
              <span class="sr-only">{{ $t("github-release-asset-package") }}</span>
            </span>
            <span v-if="entry.signed" class="release-badge tooltip" :data-tooltip="$t('signed-package')">
              <i class="fas fa-file-signature" aria-hidden="true"></i>
              <span class="sr-only">{{ $t("signed-package") }}</span>
            </span>
            <span v-if="entry.latest" class="ml-1">latest</span>
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
.release-badge {
  display: inline-block;
  margin-left: 0.25rem;
  color: var(--c-text-lightest);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
