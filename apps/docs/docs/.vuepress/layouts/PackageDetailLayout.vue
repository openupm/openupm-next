<script setup lang="ts">
import { capitalize, map } from 'lodash-es';
import axios from "axios";
import { computed, watch, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n'
import VueScrollTo from "vue-scrollto";
import { useMq } from "vue3-mq";

import ParentLayout from "@/layouts/WideLayout.vue";
import PackageDependenciesView from "@/components/PackageDependenciesView.vue";
import PackageMetadataView from "@/components/PackageMetadataView.vue";
import PackagePipelinesView from "@/components/PackagePipelinesView.vue";
import PackageReadmeView from "@/components/PackageReadmeView.vue";
import PackageRelatedView from "@/components/PackageRelatedView.vue";
import PackageVersionsView from "@/components/PackageVersionsView.vue";
import { Region, ReleaseState } from "@openupm/types";
import { usePageFrontmatter } from "@vuepress/client";
import { useDefaultStore } from "@/store";
import { AdPlacementData } from "@openupm/types";
import { getPackageMetadata, getRegion } from "@openupm/common/build/utils.js";
import { DownloadsRange, PackageInfo, PackageMetadataLocal, Packument, PackageRelease, PackageVersionViewEntry } from "@openupm/types";
import { getMonthlyDownloadsUrl, getPackageInfoUrl, getPackumentUrl, getPackageRelatedPackagesPath, isPackageDetailPath, getPackageAdPlacementUrl } from '@openupm/common/build/urls.js';
import { fillMissingDates, isPackageExist, timeAgoFormat } from '@/utils';
import UnityAssetAdPlacement from '@/components/UnityAssetAdPlacement.vue';
import UnityProSidebarAd from '@/components/UnityProSidebarAd.vue';

const route = useRoute();
const { t } = useI18n();
const mq = useMq();

const SubPageSlug = {
  deps: "deps",
  metadata: "metadata",
  pipelines: "pipelines",
  readme: "readme",
  related: "related",
  versions: "versions"
};

// State
interface State {
  packageInfo: PackageInfo,
  packument: Packument,
  monthlyDownloads: DownloadsRange,
  sameScopePackages: PackageMetadataLocal[],
  subPage: string,
  __packageInfoFetched: boolean,
  __packumentFetched: boolean,
  __monthlyDownloadsFetched: boolean,
  __sameScopePackagesFetched: boolean,
  adPlacementDataList: AdPlacementData[],
};

const initState = (): State => ({
  packageInfo: {
    releases: [],
    invalidTags: [],
    readmeHtml: null,
    readmeHtml_zhCN: null,
    scopes: [],
  },
  packument: {
    name: "",
    versions: {},
    time: {},
    readme: "",
    "dist-tags": {},
  },
  monthlyDownloads: {
    package: "",
    start: "",
    end: "",
    downloads: [],
  },
  sameScopePackages: [],
  subPage: SubPageSlug.readme,
  __packageInfoFetched: false,
  __packumentFetched: false,
  __monthlyDownloadsFetched: false,
  __sameScopePackagesFetched: false,
  adPlacementDataList: [],
});

const resetState = (): void => {
  Object.assign(state, initState());
}

const state = reactive(initState());
const store = useDefaultStore();

// Computed
const frontmatter = usePageFrontmatter();

const packageMetadata = computed(() => {
  const metadataLocal = frontmatter.value.metadataLocal as PackageMetadataLocal;
  const metadataRemote = store.packageMetadataRemoteDict[metadataLocal.name];
  return getPackageMetadata(metadataLocal, metadataRemote);
});

// The current sub page slug from the query parameter
const currentSubPageSlug = computed(() => {
  const subPageSlug = route.query.subPage;
  if (Object.values(SubPageSlug).filter(x => x == subPageSlug).length > 0)
    return subPageSlug as string;
  else
    return SubPageSlug.readme;
});

// Scroll to the top of the page when the sub page changes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
watch(currentSubPageSlug, (newValue, oldValue) => {
  VueScrollTo.scrollTo(".theme-default-content", 500, { offset: -150 });
});

// The current sub page object
const currentSubPage = computed(() => {
  for (const subPage of subPages.value)
    if (subPage.slug === currentSubPageSlug.value) return subPage;
  return subPages.value[0];
});

const dependencies = computed(() => {
  const versions = state.packument.versions || {};
  const versionInfo = packageVersion.value ? versions[packageVersion.value] : null;
  const obj = versionInfo && versionInfo.dependencies ? versionInfo.dependencies : {};
  return map(obj, (version, name) => ({ name, version }));
});

const dependenciesIcon = computed(() => {
  let isError = false;
  let isWarning = false;
  for (const { name, version } of dependencies.value) {
    // TODO: verify org.nuget.* packages
    if (name.startsWith("org.nuget.")) continue;
    const isGit = version.startsWith("git");
    if (isGit) isWarning = true;
    if (!isPackageExist(name)) isError = true;
  }
  if (isError) return "fas fa-exclamation-triangle text-error";
  else if (isWarning) return "fas fa-exclamation-triangle text-warning";
  else return "";
});

const hasNotSucceededBuild = computed(() => {
  return (
    packageReleases.value.filter(
      x => x.state != ReleaseState.Succeeded
    ).length > 0
  );
});

const invalidTags = computed(() => {
  return state.packageInfo.invalidTags || [];
});

const packageReleases = computed(() => {
  return (state.packageInfo.releases || []) as PackageRelease[];
});

const packageVersion = computed(() => {
  const distTags = state.packument["dist-tags"];
  if (distTags && distTags.latest) return distTags.latest;
  else return null;
});

const packageVersions = computed(() => {
  const versions = state.packument.versions || {};
  const times = state.packument.time;
  const versionKeys = Object.keys(versions).reverse();
  return versionKeys.map(x => {
    return {
      latest: x == packageVersion.value,
      timeSince: timeAgoFormat(times[x]),
      unity: versions[x].unity,
      version: x
    } as PackageVersionViewEntry;
  });
});

const relatedPackages = computed(() => {
  return state.sameScopePackages.filter(x => x.name != packageMetadata.value.name);
});

const pipelinesIcon = computed(() => {
  if (!packageReleases.value.length) return "";
  const rel = packageReleases.value[0];
  if (rel.state == ReleaseState.Pending)
    return "far fa-clock text-warning";
  else if (rel.state == ReleaseState.Building)
    return "fa fa-circle-notch fa-spin";
  else if (rel.state == ReleaseState.Failed)
    return "fas fa-exclamation-triangle text-warning";
  return "";
});

const readmeHtml = computed(() => {
  const html = getRegion() == Region.CN
    ? state.packageInfo.readmeHtml_zhCN
    : state.packageInfo.readmeHtml;
  return html || state.packageInfo.readmeHtml;
});

const shouldShowMetadataSubpageEntry = computed(() => {
  return mq.lgMinus;
});

const shouldShowMetadataSection = computed(() => {
  return !shouldShowMetadataSubpageEntry.value;
});

const subPages = computed(() => {
  return [
    {
      slug: SubPageSlug.readme,
      text: capitalize(t("readme")),
      visible: true,
      component: PackageReadmeView,
      props: {
        readmeHtml: readmeHtml.value,
        isLoading: !state.__packageInfoFetched,
        name: packageMetadata.value.name,
      }
    },
    {
      text: capitalize(t("installation")),
      slug: SubPageSlug.metadata,
      visible: shouldShowMetadataSubpageEntry.value,
      component: PackageMetadataView,
      props: {
        metadata: packageMetadata.value,
        packageInfo: state.packageInfo,
        packument: state.packument,
        monthlyDownloads: state.monthlyDownloads,
        hasNotSucceededBuild: hasNotSucceededBuild.value,
        packageInfoFetched: state.__packageInfoFetched,
        packumentFetched: state.__packumentFetched,
        monthlyDownloadsFetched: state.__monthlyDownloadsFetched,
      }
    },
    {
      text: capitalize(t("dependencies")),
      slug: SubPageSlug.deps,
      visible: true,
      icon: dependenciesIcon.value,
      count: dependencies.value.length,
      component: PackageDependenciesView,
      props: {
        dependencies: dependencies.value,
        isLoading: !state.__packumentFetched,
      }
    },
    {
      text: capitalize(t("versions")),
      slug: SubPageSlug.versions,
      visible: true,
      count: packageVersions.value.length,
      component: PackageVersionsView,
      props: {
        versions: packageVersions.value,
        isLoading: !state.__packumentFetched,
      }
    },
    {
      text: capitalize(t("build-pipelines")),
      slug: SubPageSlug.pipelines,
      visible: true,
      icon: pipelinesIcon.value,
      count: packageReleases.value.length,
      component: PackagePipelinesView,
      props: {
        releases: packageReleases.value,
        invalidTags: invalidTags.value,
        repoUrl: packageMetadata.value.repoUrl,
        isLoading: !state.__packageInfoFetched,
      }
    },
    {
      text: capitalize(t("related-packages")),
      slug: SubPageSlug.related,
      visible: true,
      count: relatedPackages.value.length,
      component: PackageRelatedView,
      props: {
        relatedPackages: relatedPackages.value,
        isLoading: !state.__sameScopePackagesFetched,
      }
    }
  ].map(x => {
    return {
      ...x,
      link: { path: "", query: buildRouterLinkQuery(x.slug) },
      class: { "active": x.slug == currentSubPageSlug.value }
    };
  });
});

const subPageMetadataProps = computed(() => {
  for (const subPage of subPages.value) {
    if (subPage.slug === SubPageSlug.metadata) {
      return subPage.props;
    }
  }
  return {};
});

const topics = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (frontmatter.value.topics as any[]).map(topic => {
    const tkey = topic.slug;
    const tvalue = t(tkey);
    return {
      ...topic,
      localeName: tkey == tvalue ? capitalize(topic.name) : capitalize(tvalue)
    };
  });
});

// Hooks
onMounted(() => {
  fetchAllData();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
watch(() => route.path, (newPath, oldPath) => {
  if (isPackageDetailPath(newPath)) {
    resetState();
    fetchAllData();
  }
});

// Methods

/**
 * Fetch all data.
 */
const fetchAllData = async (): Promise<void> => {
  fetchAdPlacementData();
  await fetchPackageInfo();
  await fetchPackument();
  await fetchMonthlyDownloads();
  await fetchRelatedPackages();
};

/**
 * Fetch monthly downloads.
 */
const fetchMonthlyDownloads = async (): Promise<void> => {
  try {
    const resp = await axios.get(
      getMonthlyDownloadsUrl(packageMetadata.value.name),
      { headers: { Accept: "application/json" } }
    );
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    // Align the start date to UTC midnight (00:00:00)
    startDate.setUTCHours(0, 0, 0, 0);
    // Align the end date to UTC midnight minus 1 milliseconds (59:59:59:999)
    endDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCMilliseconds(-1);
    state.monthlyDownloads = resp.data;
    state.monthlyDownloads.downloads = fillMissingDates(resp.data.downloads, startDate, endDate);
  } catch (error) {
    console.error(error);
    state.monthlyDownloads.downloads = [];
  } finally {
    state.__monthlyDownloadsFetched = true;
  }
};

/**
 * Fetch package info.
 */
const fetchPackageInfo = async (): Promise<void> => {
  try {
    const resp = await axios.get(
      getPackageInfoUrl(packageMetadata.value.name),
      { headers: { Accept: "application/json" } }
    );
    state.packageInfo = resp.data;
  } catch (error) {
    console.error(error);
  } finally {
    state.__packageInfoFetched = true;
  }
};

/**
 * Fetch packument.
 */
const fetchPackument = async (): Promise<void> => {
  try {
    let resp = await axios.get(
      getPackumentUrl(packageMetadata.value.name),
      { headers: { Accept: "application/json" } }
    );
    state.packument = resp.data;
  } catch (error) {
    console.error(error);
  } finally {
    state.__packumentFetched = true;
  }
};

/**
 * Fetch related packages.
 */
const fetchRelatedPackages = async (): Promise<void> => {
  try {
    let resp = await axios.get(
      getPackageRelatedPackagesPath(packageMetadata.value.name),
      { headers: { Accept: "application/json" } }
    );
    state.sameScopePackages = resp.data as PackageMetadataLocal[];
  } catch (error) {
    console.error(error);
  } finally {
    state.__sameScopePackagesFetched = true;
  }
}

/**
 * Fetch ad placement datas.
 */
const fetchAdPlacementData = async (): Promise<void> => {
  try {
    const resp = await axios.get(
      getPackageAdPlacementUrl(packageMetadata.value.name),
      { headers: { Accept: "application/json" } }
    );
    const data = resp.data as AdPlacementData[];
    state.adPlacementDataList = data;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Build router link query.
 * @param subPage Sub page slug.
 * @returns Router link query.
 */
const buildRouterLinkQuery = function (subPage: string): Record<string, string> {
  const query = { subPage };
  return query;
};
</script>

<template>
  <ParentLayout class="package-detail">
    <template #sidebar-top>
      <ClientOnly>
        <UnityProSidebarAd />
        <section class="subpage-section">
          <ul class="menu">
            <div class="columns">
              <div v-for="item in subPages" :key="item.slug" class="column col-12">
                <li v-show="item.visible" class="menu-item">
                  <RouterLink :class="item.class" :to="item.link" :exact="false">
                    {{ item.text }}
                    <sup v-if="item.count">{{ item.count }}</sup>
                  </RouterLink>
                </li>
              </div>
            </div>
          </ul>
          <div class="ml-2 mr-2 pt-2">
            <template v-for="(item, index) in state.adPlacementDataList" :key="index">
              <UnityAssetAdPlacement :data="item" class="mb-2" />
            </template>
          </div>
        </section>
      </ClientOnly>
    </template>
    <template #page-content-top>
      <ClientOnly>
        <div class="columns columns-contentview">
          <div class="column col-8 col-xl-8 col-lg-8 col-md-12 col-sm-12">
            <div v-if="packageMetadata.repoUnavailable" class="custom-container warning">
              <p class="custom-container-title">{{ $t("repository-is-unavailable-title") }}</p>
              <p>{{ $t("repository-is-unavailable-desc") }}</p>
            </div>
            <div v-if="topics.length" class="topic-list">
              <a v-for="item in topics" :key="item.slug" :href="item.urlPath">
                <span class="label label-default label-rounded mr-1">{{ item.localeName }}</span>
              </a>
            </div>
            <component :is="currentSubPage.component" v-bind="currentSubPage.props" />
          </div>
          <div class="column column-meta col-4 col-xl-4 col-lg-4 col-md-12 col-sm-12">
            <PackageMetadataView v-show="shouldShowMetadataSection" v-bind="subPageMetadataProps" />
          </div>
        </div>
      </ClientOnly>
    </template>
  </ParentLayout>
</template>

<style lang="scss">
@use '@/styles/palette' as *;

.package-detail {
  .theme-default-content {

    .topic-list {

      span.label {
        margin-bottom: 0.4rem;
      }
    }

    .column-meta {
      max-width: 17rem;
    }

    // hide the search field
    .content__default {
      h6 {
        display: none;
      }
    }
  }

  .sidebar {
    .subpage-section {
      .menu {
        padding: 0.4rem;
        margin: 0.2rem 0.4rem 0.4rem 0.4rem;
      }
    }
  }
}

@media (max-width: $MQMobile) {
  .package-detail {
    .theme-default-content {
      .column-meta {
        max-width: 100%;
      }
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  repository-is-unavailable-title: The source code repository is currently inaccessible to OpenUPM
  repository-is-unavailable-desc: This may be a temporary network issue. However, if the repository is deleted or made private by its author, OpenUPM will no longer track further changes. Any packages already published will not be affected.
</i18n>

<i18n locale="zh-CN" lang="yaml">
  repository-is-unavailable-title: OpenUPM目前无法访问该源代码仓库
  repository-is-unavailable-desc: 这可能是暂时的网络问题。但是，如果仓库被作者删除或设为私有，OpenUPM将不再跟踪其后续更改。已发布的任何软件包都不会受到影响。
</i18n>