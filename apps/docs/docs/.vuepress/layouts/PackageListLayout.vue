<script setup lang="ts">
import axios from "axios";
import { orderBy, capitalize, groupBy } from "lodash-es";
import { computed, watch, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
import { usePageFrontmatter } from "@vuepress/client";
import Grid from '@node_modules/vue-virtual-scroll-grid/dist/index.es.js';
import { PageProvider } from '@node_modules/vue-virtual-scroll-grid/pipeline';
import { useSearchIndex } from '@vuepress/plugin-search/client'

import ParentLayout from "@/layouts/WideLayout.vue";
import VueVirtualScrollGridBackToTop from '@/components/VueVirtualScrollGridBackToTop';
import { SortType } from "@/constant";
import { useDefaultStore } from '@/store';
import { AdPlacementData, PackageMetadata, TOPIC_ALL_SLUG, Topic } from "@openupm/types";
import { getPackageMetadata } from "@openupm/common/build/utils.js";
import { getPackageDetailPagePath, getPackageListPagePath, isPackageListPath, getTopicAdPlacementUrl } from "@openupm/common/build/urls.js";
import { topicsWithAll } from '@temp/topics.js';
import { isUnityNuGetPackageName, usePackageSearchSuggestions } from "@/search";
import UnityAssetAdPlacement from '@/components/UnityAssetAdPlacementForPackageList.vue';
import DonationSidebarAd from '@/components/DonationSidebarAd.vue';
import UnityAssetStoreSale from '@/components/UnityAssetStoreSale.vue';

const route = useRoute();
const router = useRouter();
const store = useDefaultStore();
const { t } = useI18n();
const frontmatter = usePageFrontmatter();

const sortType = ref(SortType.downloads)
const searchTerm = ref("");

const sortTypeList = computed(() => {
  const items = [
    { text: capitalize(t("name")), value: SortType.name },
    { text: capitalize(t("github-stars")), value: SortType.pop },
    { text: capitalize(t("last-publish")), value: SortType.updateTime },
    { text: capitalize(t("monthly-downloads")), value: SortType.downloads },
  ];
  return items;
});

const sortTypeOptions = computed(() => {
  return sortTypeList.value.map((x) => {
    return {
      ...x,
      link: "",
      class: x.value == sortType.value ? "active" : "",
    };
  });
});

const topicSlug = computed(() => {
  return frontmatter.value.topicSlug as string;
});

// Group topics by first letter and sort by first letter as array.
const topicGroups = computed(() => {
  const items = (topicsWithAll as Topic[]).map((x) => {
    const text = x.name.replaceAll(" ", "-").replaceAll("-&-", "-");
    return {
      link: x.urlPath,
      text,
      textFirstLetter: text.charAt(0).toUpperCase(),
      textRestLetters: text.slice(1),
      value: x.slug,
      class: x.slug === topicSlug.value ? "active" : "",
    };
  });
  const theAllEntry = items[0];
  const itemsWithoutAllEntry = items.slice(1);
  const groupedItems = Object.values(groupBy(itemsWithoutAllEntry, (item) => item.text.charAt(0).toUpperCase()));
  const sortedItems = orderBy(groupedItems, [(item): string => item[0].text.charAt(0).toUpperCase()]);
  sortedItems.unshift([theAllEntry]);
  return sortedItems;
});

const searchIndex = useSearchIndex();

const metadataEntries = computed(() => {
  let items = store.packageMetadataLocalList
    // Filter packages with topicSlug
    .filter((x) => topicSlug.value === "" || x.topics.includes(topicSlug.value))
    // Join metadata remote
    .map((x) => {
      const metadataRemote = store.packageMetadataRemoteDict[x.name];
      return getPackageMetadata(x, metadataRemote);
    })
    // Filter packages with versions.
    .filter((x) => x.ver);
  // Filter packages with search term
  if (searchTerm.value) {
    const suggestions = usePackageSearchSuggestions(searchIndex.value, searchTerm.value);
    const nameSet = new Set(suggestions.map((x) => x.name));
    items = items.filter((x) => nameSet.has(x.name));
  }
  // Sort
  if (sortType.value == SortType.updateTime)
    items = orderBy(items, ["time"], ["desc"]);
  else if (sortType.value == SortType.pop)
    items = orderBy(items, ["stars"], ["desc"]);
  else if (sortType.value == SortType.name)
    items = orderBy(items, ["name"], ["asc"]);
  else if (sortType.value == SortType.downloads)
    items = orderBy(items, ["dl30d"], ["desc"]);
  return items;
});

const packagePageSearchSuggestions = computed(() => {
  if (!searchTerm.value) return [];

  const nativePackageNames = new Set(
    store.packageMetadataLocalList.map((metadata) => metadata.name),
  );
  return usePackageSearchSuggestions(searchIndex.value, searchTerm.value)
    .filter((suggestion) => isUnityNuGetPackageName(suggestion.name))
    .filter((suggestion) => !nativePackageNames.has(suggestion.name))
    .slice(0, 20)
    .map((suggestion) => ({
      ...suggestion,
      link: getPackageDetailPagePath(suggestion.name),
    }));
});

const resultCount = computed(
  () =>
    metadataEntries.value.length + packagePageSearchSuggestions.value.length,
);

// Store ad placement data for the current topic.
const adPlacementDataList = reactive([
] as AdPlacementData[]);

// List item type that hold package metadata or ad placement data.
type ListItem = {
  type: "package" | "ad";
  value: PackageMetadata | AdPlacementData;
};

const unityAiTrialCampaignEnd = new Date("2026-07-01T00:00:00");

const unityAiTrialAdPlacementData: AdPlacementData = {
  title: "Unity AI FREE",
  image: "/images/ads/unity-ai-trial-600.jpg",
  originalPrice: "FREE",
  price: "FREE",
  url: "https://unity.com/features/ai?aid=1011lJJH",
  ratingCount: null,
  ratingAverage: 0,
  publisher: "Project-aware Assistant, AI Gateway, and MCP Server",
};

const isUnityAiTrialAdActive = computed(() => new Date() < unityAiTrialCampaignEnd);

/* The ListItems to be displayed in the grid.
 * It includes both package metadata and ad placement data.
 * Ad placement data is inserted repeatly for every a few items.
 */
const listItems = computed(() => {
  const items = [] as ListItem[];
  const adInterval = 6;
  let adIndex = 0;
  if (isUnityAiTrialAdActive.value) {
    items.push({ type: "ad", value: unityAiTrialAdPlacementData });
  }
  for (let i = 0; i < metadataEntries.value.length; i++) {
    items.push({ type: "package", value: metadataEntries.value[i] });
    if (adPlacementDataList.length > 0) {
      if ((i + 1) % adInterval === 0) {
        items.push({ type: "ad", value: adPlacementDataList[adIndex] });
        adIndex = (adIndex + 1) % adPlacementDataList.length;
      }
    }
  }
  return items;
});

const isLoading = computed(() => {
  return !store.isMetadataReady;
});

const noDataAvailableText = computed(() => {
  if (searchTerm.value) {
    if (topicSlug.value)
      return t("no-search-results-for-topic", { searchTerm: searchTerm.value });
    else
      return t("no-search-results", { searchTerm: searchTerm.value });
  }
  return t("no-data-available");
});

const addPackageLink = computed(() => {
  return {
    link: "/packages/add/",
    text: t("add-package"),
    icon: "fas fa-plus-circle",
    iconLeft: true
  };
});

const breadcrumbItems = computed(() => {
  const currentTopic = (topicsWithAll as Topic[]).find(
    (topic) => topic.slug === topicSlug.value,
  );
  if (!currentTopic || !currentTopic.slug) return [{ text: "Packages" }];
  return [
    { text: "Packages", link: "/packages/" },
    { text: currentTopic.name },
  ];
});

/* #region Grid layout */
const gridWrapperElement = ref(null);

// Dummy grid page size is fixed to 40, since everything is already loaded in meatadataEntries.
const gridPageSize = ref(40);

// Grid page provider for virtual scroll grid that returns a slice of listItems.
const gridPageProvider = computed(() => {
  // Keep a local reference of listItems to ensure reactivity. Vue's dependency tracking system
  // cannot detect reactive variables inside a function that is returned from a computed property. This
  // is because the function is not executed until it is called, so Vue has no way of knowing which
  // reactive variables it depends on.
  const _listItems = listItems.value;
  const provider: PageProvider = async (pageNumber: number, pageSize: number) => {
    const start = pageNumber * pageSize;
    const end = start + pageSize;
    return _listItems.slice(start, end);
  };
  return provider;
});

// Grid item key for virtual scroll grid.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getGridKey = (item: any): string => {
  if (item.type === "ad") return `ad:${item.value.url}`;
  if (item.value) return item.value.name;
  return item.index.toString();
};
/* #endregion */

const onSearchTermClose = (): void => {
  searchTerm.value = "";
};

/**
 * Parse query string to set initial values.
 */
const parseQuery = (): void => {
  // parse search term
  let newSearchTerm = route.query.q?.toString();
  if (newSearchTerm !== undefined) searchTerm.value = newSearchTerm;
  // parse sort type
  let newSortType = route.query.sort?.toString();
  if (newSortType === undefined)
    newSortType = SortType.downloads;
  else if (!sortTypeList.value.map((x) => x.value).includes(newSortType))
    newSortType = SortType.downloads;
  sortType.value = newSortType;
};

const query = computed(() => {
  const query: Record<string, string> = {};
  if (sortType.value) query.sort = sortType.value;
  if (searchTerm.value) query.q = searchTerm.value;
  return query;
});

/**
 * Update router for current state
 */
const updateRouter = (): void => {
  router.push({
    path: getPackageListPagePath(topicSlug.value),
    query: query.value,
  });
};

/**
 * Fetch ad placement data for the current topic.
 */
const fetchAdPlacementData = async (): Promise<void> => {
  let slug = topicSlug.value;
  if (topicSlug.value === "") slug = TOPIC_ALL_SLUG;
  try {
    const resp = await axios.get(
      getTopicAdPlacementUrl(slug),
      { headers: { Accept: "application/json" } }
    );
    const data = resp.data as AdPlacementData[];
    // Clear and push new data to adPlacementDataList.
    adPlacementDataList.splice(0);
    adPlacementDataList.push(...data);
  } catch (error) {
    console.error(error);
  }
}

// Hooks
onMounted(() => {
  parseQuery();
  store.fetchCachedPackageListData();
  fetchAdPlacementData();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
watch(() => route.path, (newPath, oldPath) => {
  if (isPackageListPath(newPath)) {
    parseQuery();
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
watch(() => route.query, (newQuery, oldQuery) => {
  if (isPackageListPath(route.path)) {
    parseQuery();
  }
});

watch(() => sortType.value, () => {
  updateRouter();
});

watch(() => searchTerm.value, () => {
  updateRouter();
});

watch(() => topicSlug.value, () => {
  store.fetchCachedPackageListData();
  fetchAdPlacementData();
});
</script>

<template>
  <ParentLayout class="package-list">
    <template #sidebar-top>
      <ClientOnly>
        <DonationSidebarAd />
        <UnityAssetStoreSale />
        <section class="quicklink-section mt-1">
          <ul class="menu">
            <li class="menu-item mb-0">
              <div class="btn-group btn-group-block">
                <AutoLink class="btn btn-default" :item="addPackageLink" />
              </div>
            </li>
          </ul>
        </section>
        <section class="state-section">
          <ul class="menu">
            <li class="menu-item">
              {{ $capitalize($t("results")) }}
              <div class="menu-badge">
                <label class="label label-default">{{ resultCount }}</label>
              </div>
            </li>
            <template v-if="searchTerm">
              <li class="divider" :data-content="$t('keywords')"></li>
              <li class="menu-item">
                <span class="chip">
                  <i class="fas fa-search"></i>
                  <span class="chip-text" :title="searchTerm">{{ searchTerm }}</span>
                  <a class="btn btn-clear" href="#" aria-label="Close" role="button" @click="onSearchTermClose"></a>
                </span>
              </li>
            </template>
            <li class="divider" :data-content="$t('sort-by')"></li>
            <li class="menu-item">
              <div class="form-group">
                <select v-model="sortType" class="form-select">
                  <option v-for="option in sortTypeOptions" :key="option.value" :value="option.value">{{ option.text }}
                  </option>
                </select>
              </div>
            </li>
          </ul>
        </section>
        <section class="topic-section">
          <ul class="menu">
            <li class="divider" :data-content="$t('topics')"></li>
            <div class="columns">
              <div v-for="(group, gindex) in topicGroups" :key="gindex" class="column col-12 tag-group">
                <span v-for="(item, index) in group" :key="item.value" class='tag-item'>
                  <RouterLink :class="['nav-link', item.class]" :to="{ path: item.link, query }" :exact="false">
                    <span v-if="index == 0"><strong>{{ item.textFirstLetter }}</strong>{{ item.textRestLetters }}</span>
                    <span v-else>{{ item.text }}</span>
                  </RouterLink>
                </span>
              </div>
            </div>
          </ul>
        </section>
      </ClientOnly>
    </template>
    <template #page-content-top>
      <SiteBreadcrumb :items="breadcrumbItems" />
      <ClientOnly>
        <div class="columns">
          <div class="column col-12">
            <section class="package-section">
              <div v-if="isLoading" class="placeholder-loader-wrapper">
                <PlaceholderLoader />
              </div>
              <div v-else>
                <client-only>
                  <section
                    v-if="packagePageSearchSuggestions.length"
                    class="package-page-results"
                  >
                    <h2>{{ $t("unitynuget-packages") }}</h2>
                    <ul>
                      <li
                        v-for="suggestion in packagePageSearchSuggestions"
                        :key="suggestion.name"
                      >
                        <RouterLink :to="suggestion.link">
                          <strong>{{ suggestion.displayName }}</strong>
                          <small>{{ suggestion.name }}</small>
                        </RouterLink>
                      </li>
                    </ul>
                  </section>
                  <div v-if="!metadataEntries.length && !packagePageSearchSuggestions.length" class="no-data">
                    {{ noDataAvailableText }}
                  </div>
                  <div v-if="metadataEntries.length" ref="gridWrapperElement" class="grid-wrapper">
                    <h2 v-if="searchTerm" class="package-results-heading">
                      {{ $t("openupm-packages") }}
                    </h2>
                    <Grid class="grid" :length="listItems.length" :page-size="gridPageSize"
                      :page-provider="gridPageProvider" :get-key="getGridKey">
                      <template #probe>
                        <!-- The virtual grid is designed to be used with a network provider.
                          To get an accurate estimation, the default slot needs to be rendered
                          after the probe slots. However, since our provider returns data instantly,
                          we need to provide a simplest probe slot with a minimum height to prevent it
                          from loading too slowly and producing an incorrect estimation. -->
                        <div style="min-height: 14rem;"></div>
                      </template>
                      <template #default="{ item, style }">
                        <template v-if="item.type === 'package'">
                          <PackageCard :metadata="item.value" :style="style" />
                        </template>
                        <template v-if="item.type === 'ad'">
                          <!-- <AdsenseInfeedForPackageList :style="style" :data="item.value" /> -->
                          <UnityAssetAdPlacement :style="style" :data="item.value" />
                        </template>
                      </template>
                    </Grid>
                  </div>
                  <VueVirtualScrollGridBackToTop :grid-wrapper="gridWrapperElement" />
                </client-only>
              </div>
            </section>
          </div>
        </div>
      </ClientOnly>
    </template>
  </ParentLayout>
</template>

<style lang="scss">
@use '@/styles/palette' as *;

.package-list {
  :is(.page, .vp-page) {
    background: #f6f8fb;
    padding-bottom: 0;
    padding-left: calc(var(--sidebar-width) + (100vw - var(--sidebar-width) - #{$package-grid-4c-width} - #{$scrollbar-width}*2)/2);

    @media screen and (max-width: $package-grid-4c-page-width) {
      padding-left: calc(var(--sidebar-width) + (100vw - var(--sidebar-width) - #{$package-grid-3c-width} - #{$scrollbar-width}*2)/2);
    }

    @media screen and (max-width: $package-grid-3c-page-width) {
      padding-left: calc(var(--sidebar-width) + (100vw - var(--sidebar-width) - #{$package-grid-2c-width} - #{$scrollbar-width}*2)/2);
    }

    @media screen and (max-width: $package-grid-2c-page-width) {
      padding-left: calc(var(--sidebar-width) + (100vw - var(--sidebar-width) - #{$package-grid-1c-width} - #{$scrollbar-width}*2)/2);
    }

    @media (max-width: $MQMobile) {
      padding-left: calc((100vw - #{$package-grid-1c-width})/2);
    }

    @media (max-width: $MQMobileNarrow) {
      padding-left: 0;
    }

    // Slow down the default transition.
    &.fade-slide-y-leave-active {
      transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
    }

    // Override the default transition to avoid the body scrollbar flashing.
    &.fade-slide-y-enter-from,
    &.fade-slide-y-leave-to {
      transform: none;
    }

    >:is(.theme-default-content, [vp-content]):not(.custom) {
      padding: 0;
      margin-top: $navbar-height;

      @media (max-width: $MQMobileNarrow) {
        padding: 0 0.5rem;
        margin-top: $navbar-height-mobile;
      }
    }
  }
}

:is(.dark, [data-theme='dark']) {
  .package-list {
    --package-list-page-bg: #2d2d2f;
    --package-list-sidebar-panel-bg: #25262a;

    :is(.page, .vp-page) {
      background: var(--package-list-page-bg);
    }

    :is(.sidebar, .vp-sidebar) {
      :is(.quicklink-section, .state-section, .topic-section) ul.menu {
        background: var(--package-list-sidebar-panel-bg);
      }

      :is(.quicklink-section, .state-section, .topic-section) .divider[data-content]::after {
        background: var(--package-list-sidebar-panel-bg);
      }
    }
  }
}
</style>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.package-section {
  .package-results-heading,
  .package-page-results h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .package-results-heading {
    margin: 0.85rem 0.4rem 0;
  }

  .package-page-results {
    margin: 1rem 0.4rem;
    max-width: 54rem;

    ul {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      list-style: none;
      margin: 0;
      padding: 0;

      @media (max-width: $MQMobile) {
        grid-template-columns: 1fr;
      }
    }

    a {
      border: 1px solid $border-color;
      border-radius: 0.25rem;
      box-shadow: none;
      display: grid;
      gap: 0.15rem;
      min-width: 0;
      padding: 0.45rem 0.6rem;
      text-decoration: none;
    }

    strong {
      color: var(--c-text);
      font-weight: 600;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      color: $gray-color;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .grid-wrapper {
    height: calc(100vh - $navbar-height);
    overflow: auto;

    @media (max-width: $MQMobileNarrow) {
      height: calc(100vh - $navbar-height-mobile);
      // Hide scrollbar
      --scrollbar-width: 0;
    }

    .grid {
      padding-top: 0;
      display: grid;
      column-gap: $package-grid-column-hgap;
      row-gap: 12px;
      place-items: start stretch;
      box-sizing: content-box;
      grid-template-columns: $package-grid-column-width $package-grid-column-width $package-grid-column-width $package-grid-column-width;

      @media screen and (max-width: $package-grid-4c-page-width) {
        grid-template-columns: $package-grid-column-width $package-grid-column-width $package-grid-column-width;
      }

      @media screen and (max-width: $package-grid-3c-page-width) {
        grid-template-columns: $package-grid-column-width $package-grid-column-width;
      }

      @media screen and (max-width: $package-grid-2c-page-width) {
        grid-template-columns: $package-grid-column-width;
      }

      @media screen and (max-width: $MQMobileNarrow) {
        grid-template-columns: 100%;
        row-gap: 8px;
      }
    }
  }

  .no-data {
    margin: 0.6rem 0.4rem;
  }
}

.menu {
  .tag-group {
    margin-left: 0.4rem;
    margin-bottom: 0.4rem;
    line-height: 1.5;

    .tag-item {
      margin-right: 0.2rem;
      padding: 0 0.2rem;

      .nav-link {
        white-space: nowrap;
      }

      strong {
        color: var(--c-text-accent-strong);
      }

      .active {
        background-color: var(--c-text-accent);
        border-radius: 0;
        box-shadow: 0 0 0 0.1rem var(--c-text-accent);
        color: #fff;

        strong {
          color: inherit;
        }
      }
    }
  }

  .chip {
    max-width: 100%;

    .chip-text {
      max-width: 82%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

:is(.sidebar, .vp-sidebar) ul.menu {
  padding: 0.4rem;
  margin: 0.2rem 0.4rem 0.4rem 0.4rem;
}

.placeholder-loader-wrapper {
  max-width: 25rem;
}
</style>
