<script setup lang="ts">
import { computed } from "vue";
import urlJoin from "url-join";

import { ReleaseState, ReleaseErrorCode } from "@openupm/types";
import { getAzureWebBuildUrl } from "@openupm/common/build/urls.js";
import { PackageRelease } from "@openupm/types";
import ReleaseErrorInfo from "./ReleaseErrorInfo.vue";

const props = defineProps({
  invalidTags: {
    type: Array<string>,
    default: () => [],
  },
  releases: {
    type: Array<PackageRelease>,
    default: () => [],
  },
  repoUrl: {
    type: String,
    default: "",
  },
  isLoading: {
    type: Boolean,
    default: true,
  },
});

const invalidTagEntries = computed(() => {
  return props.invalidTags.map((x) => {
    return {
      tag: x,
      tagLink: {
        link: urlJoin(props.repoUrl, "releases/tag", x),
        text: x,
      },
    };
  });
});

const releaseEntries = computed(() => {
  return props.releases.map((x) => {
    const displayVersion = x.publishedVersion || x.version;
    const hasScheduledVersionMismatch =
      Boolean(x.publishedVersion) && x.publishedVersion !== x.version;
    const entry = {
      ...x,
      displayVersion,
      hasScheduledVersionMismatch,
      buildLink: {
        link: getAzureWebBuildUrl(x.buildId),
        text: x.buildId,
      },
      commitLink: {
        link: urlJoin(props.repoUrl, "commit", x.commit),
        text: x.commit.substring(0, 7),
      },
      icon: "",
      note: "",
      errorReasonName: "",
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
      entry.errorReasonName =
        (ReleaseErrorCode[entry.reason] as string | undefined) || "";
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
            <span>{{ entry.displayVersion }}</span>
            <span
              v-if="entry.hasScheduledVersionMismatch"
              class="scheduled-version tooltip"
              :data-tooltip="entry.version"
            >
              {{ entry.version }}
            </span>
            <span
              v-if="entry.source === 'githubRelease'"
              class="release-badge tooltip"
              :data-tooltip="$t('github-release-asset-package')"
            >
              <i class="fas fa-paperclip" aria-hidden="true"></i>
              <span class="sr-only">{{
                $t("github-release-asset-package")
              }}</span>
            </span>
            <span
              v-if="entry.signed"
              class="release-badge tooltip"
              :data-tooltip="$t('signed-package')"
            >
              <i class="fas fa-file-signature" aria-hidden="true"></i>
              <span class="sr-only">{{ $t("signed-package") }}</span>
            </span>
          </td>
          <td>
            <AutoLink :item="entry.commitLink" />
          </td>
          <td>
            <AutoLink v-if="entry.buildId" :item="entry.buildLink" />
          </td>
          <td>
            <span>{{ entry.note }}</span>
            <ReleaseErrorInfo
              v-if="entry.state == ReleaseState.Failed"
              :reason-code="entry.reason"
              :reason-name="entry.errorReasonName"
              :build-url="entry.buildId ? entry.buildLink.link : ''"
            />
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
    <p class="queue-status-link">
      <RouterLink to="/queue/">{{ $t("queue-status") }}</RouterLink>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.subpage-pipelines {
  .table {
    .td-icon {
      width: 1rem;
    }
  }

  .release-badge {
    display: inline-block;
    margin-left: 0.25rem;
    color: var(--c-text-lightest);
  }

  .scheduled-version {
    display: inline-block;
    margin-left: 0.35rem;
    font-size: 0.75rem;
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

  .queue-status-link {
    margin: 0.35rem 0 0;
    font-size: 0.75rem;
  }
}
</style>
