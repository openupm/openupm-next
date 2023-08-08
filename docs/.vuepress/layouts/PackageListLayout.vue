<script setup lang="ts">
import { orderBy, capitalize, clamp } from "lodash-es";
import { computed, watch, onMounted, ref } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
import { useMq } from "vue3-mq";
import { usePageFrontmatter } from "@vuepress/client";
import Grid from 'vue-virtual-scroll-grid';
import { PageProvider } from 'vue-virtual-scroll-grid/pipeline';
import { useSearchIndex } from '@node_modules/@vuepress/plugin-search/lib/client/composables'

import ParentLayout from "@/layouts/WideLayout.vue";
import VueVirtualScrollGridBackToTop from '@/components/VueVirtualScrollGridBackToTop';
import { SortType } from "@/constant";
import { useDefaultStore } from '@/store';
import { PackageMetadata, Topic } from "@shared/types";
import { getPackageMetadata } from "@shared/utils";
import { translateFallback } from "@/utils";
import { getPackageListPagePath, isPackageListPath } from "@shared/urls";
import { topicsWithAll } from '@temp/topics.js';
import { usePackageSearchSuggestions } from "@/search";

const route = useRoute();
const router = useRouter();
const store = useDefaultStore();
const { t } = useI18n();
const mq = useMq();
const frontmatter = usePageFrontmatter();

const sortType = ref(SortType.downloads)
const searchTerm = ref("");
const cardGridItems = ref(4);
const cardScrollerRef = ref(null);

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

const topicEntries = computed(() => {
  return (topicsWithAll as Topic[]).map((x) => {
    const tkey = x.slug || "all";
    const tvalue = t(tkey);
    return {
      link: x.urlPath,
      text: translateFallback(t, x.slug || "all", x.name),
      value: x.slug,
      class: x.slug === topicSlug.value ? "active" : "",
    };
  });
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

/* #region Grid layout */
const gridWrapperElement = ref(null);

// Dummy grid page size is fixed to 40, since everything is already loaded in meatadataEntries.
const gridPageSize = ref(40);

// Grid page provider for virtual scroll grid that returns a slice of metadataEntries.
const gridPageProvider = computed(() => {
  // Keep a local reference of metadataEntries to ensure reactivity. Vue's dependency tracking system
  // cannot detect reactive variables inside a function that is returned from a computed property. This
  // is because the function is not executed until it is called, so Vue has no way of knowing which
  // reactive variables it depends on.
  const _metadataEntries = metadataEntries.value;
  const provider: PageProvider = async (pageNumber: number, pageSize: number) => {
    const start = pageNumber * pageSize;
    const end = start + pageSize;
    return _metadataEntries.slice(start, end);
  };
  return provider;
});

// Grid item key for virtual scroll grid.
const getGridKey = (item: any) => {
  if (item.value) return item.value.name;
  return item.index;
};

// Probe metadata for virtual scroll grid to estimate the size of grid item.
const probeMetadata = computed(() => {
  return {
    name: "com.example.probe",
    displayName: "probe",
    description: "The probe slot is used to measure the visual size of grid item. It has no prop. You can pass the same element/component for the placeholder slot. If not provided, you must set a fixed height to grid-template-rows on your CSS grid, e.g. 200px. If provided, make sure it is styled with the same dimensions as rendered items in the default or placeholder slot. Otherwise, the view wouldn't be rendered properly, or the rendering could be very slow.",
    licenseSpdxId: "mit",
    licenseName: "MIT License",
    image: null,
    imageFilename: null,
    topics: [],
    hunter: "openupm",
    repo: "favoyang/com.example.probe",
    owner: "favoyang",
    ver: "0.0.0",
    time: (new Date()).getTime(),
    stars: 1000,
    pstars: 0,
    unity: "2019.4",
    dl30d: 1000,
  } as any as PackageMetadata;
});
/* #endregion */

const onSearchTermClose = () => {
  searchTerm.value = "";
};

/**
 * Parse query string to set initial values.
 */
const parseQuery = () => {
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
  const query = {} as any;
  if (sortType.value) query.sort = sortType.value;
  if (searchTerm.value) query.q = searchTerm.value;
  return query;
});

/**
 * Update router for current state
 */
const updateRouter = () => {
  router.push({
    path: getPackageListPagePath(topicSlug.value),
    query: query.value,
  });
};

// Hooks
onMounted(() => {
  parseQuery();
});

watch(() => route.path, (newPath, oldPath) => {
  if (isPackageListPath(newPath)) {
    parseQuery();
  }
});

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
</script>

<template>
  <ParentLayout class="package-list">
    <template #sidebar-top>
      <ClientOnly>
        <section class="quicklink-section first">
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
                <label class="label label-default">{{ metadataEntries.length }}</label>
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
              <div v-for="item in topicEntries" :key="item.value" class="column col-12">
                <li class="menu-item">
                  <RouterLink :class="['nav-link', item.class]" :to="{ path: item.link, query }" :exact="false">
                    {{ item.text }}
                  </RouterLink>
                </li>
              </div>
            </div>
          </ul>
        </section>
      </ClientOnly>
    </template>
    <template #page-content-top>
      <ClientOnly>
        <div class="columns">
          <div class="column col-12">
            <section class="package-section">
              <div v-if="isLoading" class="placeholder-loader-wrapper">
                <PlaceholderLoader />
              </div>
              <div v-else>
                <client-only>
                  <div class="no-data" v-if="!metadataEntries.length">
                    {{ noDataAvailableText }}
                  </div>
                  <div v-else class="grid-wrapper" ref="gridWrapperElement">
                    <Grid class="grid" :length="metadataEntries.length" :page-size="gridPageSize"
                      :page-provider="gridPageProvider" :get-key="getGridKey">
                      <template v-slot:probe>
                        <!-- The virtual grid is designed to be used with a network provider.
                          To get an accurate estimation, the default slot needs to be rendered
                          after the probe slots. However, since our provider returns data instantly,
                          we need to provide a simplest probe slot with a minimum height to prevent it
                          from loading too slowly and producing an incorrect estimation. -->
                        <div style="min-height: 14rem;"></div>
                      </template>
                      <template v-slot:default="{ item, style }">
                        <PackageCard :metadata="item" :style="style" />
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
  .page {
    padding-bottom: 0;

    // Slow down the default transition.
    &.fade-slide-y-leave-active {
      transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
    }

    // Override the default transition to avoid the body scrollbar flashing.
    &.fade-slide-y-enter-from,
    &.fade-slide-y-leave-to {
      transform: none;
    }

    >.theme-default-content:not(.custom) {
      padding: 0;
      margin-top: $navbar-height;

      @media (max-width: $MQMobileNarrow) {
        padding: 0 0.5rem;
        margin-top: $navbar-height-mobile;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.package-section {

  .grid-wrapper {
    height: calc(100vh - $navbar-height);
    overflow: auto;

    @media (max-width: $MQMobileNarrow) {
      height: calc(100vh - $navbar-height-mobile);
      // Hide scrollbar
      --scrollbar-width: 0;
    }

    .grid {
      padding-top: 0.85rem;
      display: grid;
      grid-gap: 0.4rem;
      place-items: start stretch;
      box-sizing: content-box;
      grid-template-columns: 14.7rem 14.7rem 14.7rem 14.7rem;

      @media (max-width: $size-2x) {
        grid-template-columns: 14.7rem 14.7rem 14.7rem;
      }

      @media (max-width: $size-lg) {
        grid-template-columns: 14.7rem 14.7rem;
      }

      @media (max-width: $MQMobileNarrow) {
        grid-template-columns: 100%;
      }
    }
  }

  .no-data {
    margin: 0.6rem 0.4rem;
  }
}

.sidebar {
  section.first {
    margin-top: 0.6rem;
  }
}

.menu {
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

.sidebar ul.menu {
  padding: 0.4rem;
  margin: 0.2rem 0.4rem 0.4rem 0.4rem;
}

.placeholder-loader-wrapper {
  max-width: 25rem;
}
</style>

<i18n locale="en-US" lang="yaml">
add-package: Submit new package
results: results
sort-by: Sort by
keywords: Keywords
no-data-available: No packages available for this topic.
no-search-results: No search results for "{ searchTerm }".
no-search-results-for-topic: No search results for "{ searchTerm }" in this topic.
</i18n>

<i18n locale="zh-CN" lang="yaml">
add-package: 添加新软件包
results: 结果
sort-by: 排序
keywords: 关键词
no-data-available: 此主题下没有可用的包。
no-search-results: 没有与 "{ searchTerm }" 相关的搜索结果。
no-search-results-for-topic: 此主题下没有与 "{ searchTerm }" 相关的搜索结果。
</i18n>