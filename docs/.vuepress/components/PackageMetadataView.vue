<script setup lang="ts">
import { capitalize } from 'lodash-es';
import escape from "escape-html";
import { PropType, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { timeAgoFormat } from '@/utils';
import { getAvatarImageUrl, getGitHubPackageMetadataUrl, getPackageDetailPageUrl } from '@shared/urls';
import { DownloadsRange, PackageInfo, PackageMetadata, PackageRegistryInfo } from "@shared/types";

const { t } = useI18n();

const props = defineProps({
  hasNotSucceededBuild: {
    type: Boolean,
    default: false,
  },
  packageInfoFetched: {
    type: Boolean,
    default: false,
  },
  registryInfoFetched: {
    type: Boolean,
    default: false,
  },
  monthlyDownloadsFetched: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: Object as PropType<PackageMetadata>,
    default: () => { },
  },
  packageInfo: {
    type: Object as PropType<PackageInfo>,
    default: () => { },
  },
  registryInfo: {
    type: Object as PropType<PackageRegistryInfo>,
    default: () => { },
  },
  monthlyDownloads: {
    type: Object as PropType<DownloadsRange>,
    default: () => { },
  }
});

const badgeVersionImageUrl = computed(() => {
  return `https://img.shields.io/npm/v/${props.metadata.name}?label=openupm&registry_uri=https://package.openupm.com`;
});

const badgeVersionHtml = computed(() => {
  const packageDetailPageUrl = getPackageDetailPageUrl(props.metadata.name);
  return `<a href="${escape(packageDetailPageUrl)}"><img src="${escape(
    badgeVersionImageUrl.value
  )}" /></a>`;
});

const badgeVersionMarkdown = computed(() => {
  const packageDetailPageUrl = getPackageDetailPageUrl(props.metadata.name);
  return `[![openupm](${badgeVersionImageUrl.value})](${packageDetailPageUrl})`;
});

const badgeDownloadsImageUrl = computed(() => {
  return `https://img.shields.io/badge/dynamic/json?color=brightgreen&label=downloads&query=%24.downloads&suffix=%2Fmonth&url=https%3A%2F%2Fpackage.openupm.com%2Fdownloads%2Fpoint%2Flast-month%2F${props.metadata.name}`
});

const badgeDownloadsHtml = computed(() => {
  const packageDetailPageUrl = getPackageDetailPageUrl(props.metadata.name);
  return `<a href="${escape(packageDetailPageUrl)}"><img src="${escape(
    badgeDownloadsImageUrl.value
  )}" /></a>`;
});

const badgeDownloadsMarkdown = computed(() => {
  const packageDetailPageUrl = getPackageDetailPageUrl(props.metadata.name);
  return `[![openupm](${badgeDownloadsImageUrl.value})](${packageDetailPageUrl})`;
});

const hunterAvatarUrl = computed(() => {
  return props.metadata.hunter
    ? getAvatarImageUrl(props.metadata.hunter, 48)
    : null;
});

const hunterNavLink = computed(() => {
  return {
    link: props.metadata.hunterUrl,
    text: props.metadata.hunter,
  };
});

const isLoadingPackageSetup = computed(() => {
  return !props.registryInfoFetched || !props.packageInfoFetched;
});

const monthlyDownloadsCount = computed(() => {
  if (!props.monthlyDownloadsFetched) return "-";
  return props.monthlyDownloads.downloads.reduce((acc, curr) => acc + curr.downloads, 0).toLocaleString();
});

const monthlyDownloadsList = computed(() => {
  if (props.monthlyDownloadsFetched && props.monthlyDownloads.downloads && props.monthlyDownloads.downloads.length)
    return props.monthlyDownloads.downloads.map(item => item.downloads);
  return Array(30).fill(0);
});

const ownerAvatarUrl = computed(() => {
  return getAvatarImageUrl(props.metadata.owner, 48);
});

const ownerNavLink = computed(() => {
  return {
    link: props.metadata.ownerUrl,
    text: props.metadata.owner,
  };
});

const parentOwnerAvatarUrl = computed(() => {
  return props.metadata.parentOwner
    ? getAvatarImageUrl(props.metadata.parentOwner, 48)
    : null;
});

const parentOwnerNavLink = computed(() => {
  if (props.metadata.parentRepoUrl)
    return {
      link: props.metadata.parentOwnerUrl,
      text: props.metadata.parentOwner,
    };
  return null;
});

const parentRepoNavLink = computed(() => {
  if (props.metadata.parentRepoUrl)
    return {
      link: props.metadata.parentRepoUrl,
      text: props.metadata.parentRepo,
    };
  return null;
});

const publishedAt = computed(() => {
  const time = props.registryInfo.time || {};
  if (version.value) {
    const dateTimeStr = time[version.value];
    if (!dateTimeStr) return null;
    return timeAgoFormat(dateTimeStr);
  }
  return null;
});

const scopes = computed(() => {
  return props.packageInfo.scopes;
});

const repoNavLink = computed(() => {
  return {
    link: props.metadata.repoUrl,
    text: props.metadata.repo,
  };
});

const reportLink = computed(() => {
  return {
    link: "https://github.com/openupm/openupm/issues/new?title=Report%20package%20abuse&template=abuse.md",
    text: capitalize(t("report-malware-or-abuse")),
  };
});

const unityVersion = computed(() => {
  const versions = props.registryInfo.versions || {};
  if (version.value) {
    const entry = versions[version.value];
    if (!entry || !entry.unity) return null;
    return entry.unity;
  }
  return null;
});

const version = computed(() => {
  const distTags = props.registryInfo["dist-tags"];
  if (distTags && distTags.latest) return distTags.latest;
  else return null;
});

const editLink = computed(() => {
  return {
    link: getGitHubPackageMetadataUrl(props.metadata.name),
    text: t("edit-metadata")
  };
});
</script>

<template>
  <div class="meta-section container">
    <div class="columns">
      <PackageSetup :has-not-succeeded-build="hasNotSucceededBuild" :is-loading="isLoadingPackageSetup"
        :metadata="metadata" :version="version || ''" :scopes="scopes" />
      <section class="col-12">
        <div class="metadata-title">{{ $capitalize($t("repository")) }}</div>
        <span class="repo-link">
          <AutoLink :item="repoNavLink" />
        </span>
        <div v-if="parentRepoNavLink" class="fork">
          {{ $capitalize($t("upstream")) }}
          <AutoLink :item="parentRepoNavLink" />
        </div>
      </section>
      <section class="col-6 col-downloads">
        <div class="metadata-title">{{ $capitalize($t("monthly-downloads")) }}</div>
        <span class="monthly-downloads-count">{{ monthlyDownloadsCount }}</span>
      </section>
      <section class="col-6 col-downloads">
        <div class="metadata-title"></div>
        <Sparkline v-bind:data-points="monthlyDownloadsList" class="monthly-downloads-chart"></Sparkline>
      </section>
      <section class="col-6">
        <div class="metadata-title">{{ $capitalize($t("version")) }}</div>
        <span>{{ version || "-" }}</span>
      </section>
      <section class="col-6">
        <div class="metadata-title">{{ $capitalize($t("license")) }}</div>
        <span>{{ metadata.licenseSpdxId || metadata.licenseName || "-" }}</span>
      </section>
      <section class="col-6">
        <div class="metadata-title">{{ $capitalize($t("unity-version")) }}</div>
        <span>{{ unityVersion || "-" }}</span>
      </section>
      <section class="col-6">
        <div class="metadata-title"><i class="fab fa-github"></i> Stars</div>
        <span>
          <i class="fa fa-star"></i>
          {{ metadata.stars }}
        </span>
      </section>
      <section class="col-12">
        <div class="metadata-title">{{ $capitalize($t("last-publish")) }}</div>
        <span>{{ publishedAt || "-" }}</span>
      </section>
      <section class="col-6">
        <div class="metadata-title">{{ $capitalize($t("authors")) }}</div>
        <a v-if="parentOwnerNavLink && parentOwnerNavLink.link" :href="parentOwnerNavLink.link" class="nav-link external">
          <span class="chip">
            <LazyImage v-if="parentOwnerAvatarUrl" :src="parentOwnerAvatarUrl" :alt="metadata.parentOwner"
              class="avatar avatar-sm" />
            {{ parentOwnerNavLink.text }}
          </span>
        </a>
        <a :href="ownerNavLink.link" class="nav-link external">
          <span class="chip">
            <LazyImage :src="ownerAvatarUrl" :alt="metadata.owner" class="avatar avatar-sm" />
            {{ ownerNavLink.text }}
          </span>
        </a>
      </section>
      <section class="col-6">
        <div class="metadata-title">{{ $capitalize($t("discovered-by")) }}</div>
        <a v-if="hunterNavLink.link" :href="hunterNavLink.link" class="nav-link external">
          <span class="chip">
            <LazyImage :src="hunterAvatarUrl" :alt="hunterNavLink.text" class="avatar avatar-sm" />
            {{ hunterNavLink.text }}
          </span>
        </a>
        <span v-else>{{ metadata.hunter }}</span>
      </section>
      <section class="col-12">
        <div class="metadata-title">
          {{ $capitalize($t("badge")) }}
        </div>
        <div class="container">
          <div class="columns">
            <div class="col-6 col-badge">
              <LazyImage :src="badgeVersionImageUrl" />
            </div>
            <div class="col-6 col-badge">
              <CopyWrapper :copy-text="badgeVersionHtml">
                <a>
                  <small> html </small>
                </a>
              </CopyWrapper>
              <span><small>|</small></span>
              <CopyWrapper :copy-text="badgeVersionMarkdown">
                <a>
                  <small> markdown </small>
                </a>
              </CopyWrapper>
            </div>
            <div class="col-6 col-badge">
              <LazyImage :src="badgeDownloadsImageUrl" />
            </div>
            <div class="col-6 col-badge">
              <CopyWrapper :copy-text="badgeDownloadsHtml">
                <a>
                  <small> html </small>
                </a>
              </CopyWrapper>
              <span><small>|</small></span>
              <CopyWrapper :copy-text="badgeDownloadsMarkdown">
                <a>
                  <small> markdown </small>
                </a>
              </CopyWrapper>
            </div>
          </div>
        </div>
      </section>
      <section class="col-12">
        <AutoLink :item="reportLink" />
      </section>
      <section class="col-12">
        <AutoLink :item="editLink" />
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.package-detail .meta-section {
  font-size: $font-size-md;
  padding-left: 0.5rem;

  .metadata-title {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: var(--c-text-lightest);
  }

  section {
    border-bottom: 1px solid var(--c-border);
    padding-bottom: 0.5rem;
    margin-bottom: 0.7rem;

    >span {
      font-size: 0.85rem;
      font-weight: bold;
    }

    span.repo-link {
      font-size: $font-size-md;

      a {
        font-weight: bold;
      }
    }
  }

  section.col-downloads {
    padding-bottom: 0;

    span.monthly-downloads-count {
      display: block;
      height: 44px;
      padding-top: 10px;
    }

    span.monthly-downloads-count,
    .monthly-downloads-chart {
      margin-bottom: -4px;
    }
  }

  .col-badge {
    margin-bottom: 0.2rem;
  }

  ul.section-list {
    margin: 0;
    list-style: none;
  }

  img {
    vertical-align: middle;
  }

  .fork {
    font-size: 0.7rem;

    a {
      font-size: 0.7rem;
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  report-malware-or-abuse: report malware or abuse
  edit-metadata: Edit package metadata
</i18n>

<i18n locale="zh-CN" lang="yaml">
  report-malware-or-abuse: 举报恶意软件或滥用
  edit-metadata: 编辑软件包元数据
</i18n>