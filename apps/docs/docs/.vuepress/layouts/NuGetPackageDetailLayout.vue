<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { usePageFrontmatter } from "@vuepress/client";

import ParentLayout from "@/layouts/WideLayout.vue";
import AdsenseDisplayForPackageDetail from "@/components/AdsenseDisplayForPackageDetail.vue";
import PackageDependenciesView from "@/components/PackageDependenciesView.vue";
import PackageSetup from "@/components/PackageSetup.vue";
import PackageVersionsView from "@/components/PackageVersionsView.vue";
import UnityAssetAdPlacement from "@/components/UnityAssetAdPlacement.vue";
import {
  getLatestNuGetVersion,
  getNuGetDependencies,
  getNuGetPackageMetadata,
  getNuGetPackageVersions,
  getNuGetRepositoryUrl,
  getNuGetVersionInfo,
  NuGetPackageFrontmatter,
} from "@/nugetPackageDetail";
import { AdPlacementData, Packument } from "@openupm/types";
import {
  getPackageAdPlacementUrl,
  getPackumentUrl,
  isPackageDetailPath,
} from "@openupm/common/build/urls.js";

const route = useRoute();
const frontmatter = usePageFrontmatter<NuGetPackageFrontmatter>();

const packagesLink = {
  text: "Packages",
  link: "/packages/",
};

type State = {
  adPlacementDataList: AdPlacementData[];
  packument: Partial<Packument>;
  isLoading: boolean;
  isUnavailable: boolean;
};

const initState = (): State => ({
  adPlacementDataList: [],
  packument: {},
  isLoading: true,
  isUnavailable: false,
});

const state = reactive(initState());
let packumentRequestId = 0;
let adPlacementRequestId = 0;

const packageName = computed(() => frontmatter.value.name);
const latestVersion = computed(() =>
  getLatestNuGetVersion(state.packument, frontmatter.value.unityNuGetVersion),
);
const latestVersionInfo = computed(() =>
  getNuGetVersionInfo(state.packument, latestVersion.value),
);
const dependencies = computed(() =>
  getNuGetDependencies(latestVersionInfo.value),
);
const versions = computed(() =>
  getNuGetPackageVersions(state.packument, latestVersion.value),
);
const repositoryUrl = computed(() =>
  getNuGetRepositoryUrl(latestVersionInfo.value),
);
const packageMetadata = computed(() =>
  getNuGetPackageMetadata(packageName.value, repositoryUrl.value),
);
const displayName = computed(
  () => latestVersionInfo.value.displayName || frontmatter.value.nugetId,
);
const description = computed(() => latestVersionInfo.value.description || "");
const author = computed(() => latestVersionInfo.value.author || "");

const resetState = (): void => {
  Object.assign(state, initState());
};

const isCurrentRequest = (
  requestId: number,
  latestRequestId: number,
  requestedPackageName: string,
): boolean =>
  requestId === latestRequestId && requestedPackageName === packageName.value;

const fetchPackument = async (): Promise<void> => {
  const requestId = ++packumentRequestId;
  const requestedPackageName = packageName.value;
  state.isLoading = true;
  state.isUnavailable = false;
  try {
    const resp = await axios.get(getPackumentUrl(requestedPackageName), {
      headers: { Accept: "application/json" },
    });
    if (!isCurrentRequest(requestId, packumentRequestId, requestedPackageName))
      return;
    state.packument = resp.data;
  } catch (error) {
    if (!isCurrentRequest(requestId, packumentRequestId, requestedPackageName))
      return;
    console.error(error);
    state.isUnavailable = true;
    state.packument = {};
  } finally {
    if (isCurrentRequest(requestId, packumentRequestId, requestedPackageName)) {
      state.isLoading = false;
    }
  }
};

const fetchAdPlacementData = async (): Promise<void> => {
  const requestId = ++adPlacementRequestId;
  const requestedPackageName = packageName.value;
  try {
    const resp = await axios.get(getPackageAdPlacementUrl(requestedPackageName), {
      headers: { Accept: "application/json" },
    });
    if (!isCurrentRequest(requestId, adPlacementRequestId, requestedPackageName))
      return;
    state.adPlacementDataList = resp.data as AdPlacementData[];
  } catch (error) {
    if (!isCurrentRequest(requestId, adPlacementRequestId, requestedPackageName))
      return;
    console.error(error);
    state.adPlacementDataList = [];
  }
};

const fetchAllData = async (): Promise<void> => {
  fetchAdPlacementData();
  await fetchPackument();
};

onMounted(() => {
  fetchAllData();
});

watch(
  () => route.path,
  (newPath) => {
    if (isPackageDetailPath(newPath)) {
      resetState();
      fetchAllData();
    }
  },
);
</script>

<template>
  <ParentLayout class="nuget-package-detail">
    <template #sidebar-top>
      <ClientOnly>
        <div class="nuget-sidebar-ad">
          <AdsenseDisplayForPackageDetail />
        </div>
      </ClientOnly>
    </template>
    <template #page-content-top>
      <ClientOnly>
        <div class="columns columns-contentview">
          <div class="column col-8 col-xl-8 col-lg-8 col-md-12 col-sm-12">
            <nav aria-label="Breadcrumb">
              <ul class="breadcrumb package-breadcrumb">
                <li class="breadcrumb-item">
                  <AutoLink :item="packagesLink" />
                </li>
                <li class="breadcrumb-item">
                  <a href="#">{{ packageName }}</a>
                </li>
              </ul>
            </nav>

            <div v-if="state.isUnavailable" class="custom-container warning">
              <p class="custom-container-title">UnityNuGet package data is unavailable</p>
              <p>
                This page is generated from the UnityNuGet package list, but live package data is loaded from the
                OpenUPM registry uplink and cache. Try again after the registry cache refreshes.
              </p>
            </div>

            <section class="package-identity">
              <h1>{{ displayName }}</h1>
              <p class="package-name">{{ packageName }}</p>
              <p v-if="description" class="package-description">{{ description }}</p>
              <dl class="identity-list">
                <div>
                  <dt>NuGet ID</dt>
                  <dd>{{ frontmatter.nugetId }}</dd>
                </div>
                <div>
                  <dt>Latest version</dt>
                  <dd>{{ latestVersion || "Unavailable" }}</dd>
                </div>
                <div v-if="author">
                  <dt>Author</dt>
                  <dd>{{ author }}</dd>
                </div>
                <div v-if="repositoryUrl">
                  <dt>Repository</dt>
                  <dd><a :href="repositoryUrl">{{ repositoryUrl }}</a></dd>
                </div>
              </dl>
            </section>
            <PackageDependenciesView
              :dependencies="dependencies"
              :is-loading="state.isLoading"
            />
            <PackageVersionsView :versions="versions" :is-loading="state.isLoading" />
          </div>
          <div class="column column-meta col-4 col-xl-4 col-lg-4 col-md-12 col-sm-12">
            <div class="meta-section container">
              <div class="columns">
                <PackageSetup
                  :is-loading="state.isLoading"
                  :metadata="packageMetadata"
                  :version="latestVersion"
                  :packument="state.packument"
                  :scopes="['org.nuget']"
                />
                <section class="col-12 ad-placement-section">
                  <template v-for="(item, index) in state.adPlacementDataList" :key="index">
                    <UnityAssetAdPlacement :data="item" class="mb-2" />
                  </template>
                </section>
                <section class="col-12 adsense-section">
                  <AdsenseDisplayForPackageDetail />
                </section>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </template>
  </ParentLayout>
</template>

<style lang="scss">
@use '@/styles/palette' as *;

.nuget-package-detail {
  .theme-default-content {
    .content__default {
      h1 {
        display: none;
      }
    }

    .column-meta {
      max-width: 17rem;
    }
  }

  .package-breadcrumb {
    margin-bottom: 0.8rem;
  }

  .package-identity {
    margin-bottom: 1rem;

    h1 {
      margin: 0.2rem 0 0.1rem;
      padding-top: 0;
    }

    .package-name {
      color: var(--c-text-light);
      font-family: var(--font-family-code);
      overflow-wrap: anywhere;
    }

    .package-description {
      max-width: 42rem;
    }
  }

  .identity-list {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 0.25rem 1rem;
    margin: 1rem 0;

    div {
      display: contents;
    }

    dt {
      color: var(--c-text-light);
      font-weight: 600;
    }

    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
  }
}

.nuget-package-detail .meta-section {
  font-size: $font-size-md;
  padding-left: 0.5rem;
}

.nuget-package-detail .nuget-sidebar-ad {
  margin: 0.2rem 0.4rem 0.4rem;
}

@media (max-width: $MQMobile) {
  .nuget-package-detail {
    .identity-list {
      grid-template-columns: 1fr;
    }

    .theme-default-content {
      .column-meta {
        max-width: 100%;
      }
    }
  }
}
</style>
