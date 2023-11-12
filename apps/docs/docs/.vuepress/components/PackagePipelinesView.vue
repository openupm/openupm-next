<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { paramCase } from "change-case";
import urlJoin from "url-join";

import { ReleaseState, ReleaseErrorCode } from "@openupm/types";
import { getAzureWebBuildUrl } from '@openupm/common/build/urls.js';
import { PackageRelease } from '@openupm/types';

const { t } = useI18n();

// A map from release reason value (number) to note's i18n key (string)
const releaseReasonLocaleNoteKeyMap = computed(() => {
  const map: { [key: number]: string } = {};
  for (const key in ReleaseErrorCode) {
    if (isNaN(Number(key))) {
      const value = ReleaseErrorCode[key] as unknown as number;
      map[value] = "release-reason-" + paramCase(key);
    }
  }
  return map;
});

const props = defineProps({
  invalidTags: {
    type: Array<string>,
    default: () => []
  },
  releases: {
    type: Array<PackageRelease>,
    default: () => []
  },
  repoUrl: {
    type: String,
    default: ""
  },
  isLoading: {
    type: Boolean,
    default: true
  }
});

const invalidTagEntries = computed(() => {
  return props.invalidTags.map(x => {
    return {
      tag: x,
      tagLink: {
        link: urlJoin(props.repoUrl, "releases/tag", x),
        text: x
      }
    };
  });
});

const releaseEntries = computed(() => {
  return props.releases.map(x => {
    const entry = {
      ...x,
      buildLink: {
        link: getAzureWebBuildUrl(x.buildId),
        text: x.buildId
      },
      commitLink: {
        link: urlJoin(props.repoUrl, "commit", x.commit),
        text: x.commit.substring(0, 7)
      },
      icon: "",
      note: "",
      errorCode: "",
      errorMessage: ""
    };
    if (entry.state == ReleaseState.Pending) {
      entry.icon = "far fa-clock";
      entry.note = "Pending...";
    } else if (entry.state == ReleaseState.Building) {
      entry.icon = "fa fa-spinner fa-spin";
      entry.note = "Building...";
    } else if (entry.state == ReleaseState.Succeeded) {
      entry.icon = "fa fa-check-circle text-success";
    } else if (entry.state == ReleaseState.Failed) {
      entry.icon = "fa fa-times-circle text-error";
      entry.errorCode = `E${entry.reason}`;
      const tkey = releaseReasonLocaleNoteKeyMap.value[entry.reason];
      const tvalue = t(tkey);
      entry.errorMessage = tkey == tvalue ? "" : tvalue;
    }
    return entry;
  });
});
</script>

<template>
  <div v-if="props.isLoading">
    <PlaceholderLoader />
  </div>
  <div v-else class="subpage-pipelines">
    <h2>
      {{ $capitalize($t("build-pipelines")) }}
      <sup>{{ releaseEntries.length }}</sup>
    </h2>
    <table v-if="releaseEntries.length" class="table">
      <thead>
        <tr>
          <th class="td-icon"></th>
          <th>{{ $capitalize($t("git-tag")) }}</th>
          <th>{{ $capitalize($t("version")) }}</th>
          <th>{{ $capitalize($t("commit")) }}</th>
          <th>{{ $capitalize($t("build")) }}</th>
          <th>{{ $capitalize($t("note")) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in releaseEntries" :key="entry.tag">
          <td>
            <i :class="entry.icon"></i>
          </td>
          <td>{{ entry.tag }}</td>
          <td>
            {{ entry.version }}
          </td>
          <td>
            <AutoLink :item="entry.commitLink" />
          </td>
          <td>
            <AutoLink v-if="entry.buildId" :item="entry.buildLink" />
          </td>
          <td>
            <span>{{ entry.note }}</span>
            <span v-show="entry.errorCode" class="label label-warning mr-2">{{ entry.errorCode }}</span>
            <span class="hide-sm">{{ entry.errorMessage }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="invalidTagEntries.length" class="table">
      <thead>
        <tr>
          <th>{{ $t("invalid-git-tag-col-text") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in invalidTagEntries" :key="entry.tag">
          <td>
            <AutoLink :item="entry.tagLink" />
          </td>
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
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  invalid-git-tag-col-text: Invalid Git tag (e.g. not semver-compliant or duplicate version)
</i18n>

<i18n locale="zh-CN" lang="yaml">
  invalid-git-tag-col-text: 无效的Git标签（非semver或重复的版本）
</i18n>