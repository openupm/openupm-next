<script setup lang="ts">
import { orderBy, capitalize, clamp } from "lodash-es";
import { computed, watch, onMounted, ref } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
import { useMq } from "vue3-mq";
import { usePageFrontmatter } from "@vuepress/client";
import { useElementBounding } from '@vueuse/core';
import { RecycleScroller } from 'vue-virtual-scroller';
import '@node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

import ParentLayout from "@/layouts/WideLayout.vue";
import { SortType } from "@/constant";
import PackageCard from "@/components/PackageCard.vue";
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import { useDefaultStore } from '@/store';
import { Topic } from "@shared/types";
import { getPackageMetadata } from "@shared/utils";
import { translateFallback } from "@/utils";
import { getPackageListPagePath, isPackageListPath } from "@shared/urls";
import { topicsWithAll } from '@temp/topics.js';

const route = useRoute();
const router = useRouter();
const store = useDefaultStore();
const { t } = useI18n();
const mq = useMq();
const frontmatter = usePageFrontmatter();

const sortType = ref(SortType.downloads)
const cardGridItems = ref(4);
const cardScrollerRef = ref(null);

const sortTypeList = computed(() => [
  { text: capitalize(t("name")), value: SortType.name },
  { text: capitalize(t("github-stars")), value: SortType.pop },
  { text: capitalize(t("last-publish")), value: SortType.updateTime },
  { text: capitalize(t("monthly-downloads")), value: SortType.downloads },
]);

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

const cardWidth = computed(() => {
  if (mq.sm || mq.xs) return window.innerWidth - 6;
  return 300;
});

const cardHeight = computed(() => {
  if (mq.xs) return 360;
  if (mq.sm) return 400;
  return 300;
});

const onCardScrollerResize = function () {
  // We use this to get the width of the scrolling container:
  const { width } = useElementBounding(cardScrollerRef);
  // Calculate the maximum media posters we can fit in a row based on the scroller width:
  cardGridItems.value = clamp(Math.floor(width.value / cardWidth.value), 1, 6);
}

/**
 * Parse query string to set initial values.
 */
const parseQuery = () => {
  // parse sort type
  let newSortType = route.query.sort?.toString();
  if (newSortType === undefined || !sortTypeList.value.map((x) => x.value).includes(newSortType))
    newSortType = SortType.downloads;
  if (newSortType != sortType.value)
    sortType.value = newSortType;
};

const query = computed(() => {
  const query = {} as any;
  if (sortType.value) query.sort = sortType.value;
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

watch(() => sortType.value, () => {
  updateRouter();
});
</script>

<template>
  <ParentLayout class="package-list">
    <template #sidebar-top>
      <section class="state-section">
        <ul class="menu">
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
    </template>
    <template #page-content-top>
      <div class="columns">
        <div class="column col-12">
          <section class="package-section">
            <div v-if="isLoading" class="placeholder-loader-wrapper">
              <PlaceholderLoader />
            </div>
            <div v-else>
              <client-only>
                <div v-if="!metadataEntries.length">
                  {{ $t('no-data-available') }}
                </div>
                <RecycleScroller ref="cardScrollerRef" class="card-scroller" :items="metadataEntries" key-field="name"
                  :grid-items="cardGridItems" :item-size="cardHeight" :item-secondary-size="cardWidth"
                  @resize="onCardScrollerResize">
                  <template #default="{ item, index }">
                    <div class="mr-1">
                      <PackageCard :metadata="item" />
                    </div>
                  </template>
                </RecycleScroller>
              </client-only>
            </div>
          </section>
        </div>
      </div>
    </template>
  </ParentLayout>
</template>

<style lang="scss">
@use '@/styles/palette' as *;

.package-list {
  .page {
    padding-bottom: 0;

    >.theme-default-content:not(.custom) {
      padding: 0;
    }
  }
}

@media (max-width: $MQMobileNarrow) {
  .package-list {
    .page {
      >.theme-default-content:not(.custom) {
        padding: 0 0.5rem;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.package-section {
  .card-scroller {
    // The vue-virtual-scroller requires a fixed height to work properly.
    height: calc(100vh - $theme-default-content-margin-top);
  }

  .column {
    &.col-card {
      width: 15rem;
      flex: none;
    }
  }
}

.state-section {
  margin-top: 0.6rem;
}

.sidebar ul.menu {
  padding: 0.4rem;
  margin: 0.2rem 0.4rem 0.4rem 0.4rem;
}

.placeholder-loader-wrapper {
  max-width: 25rem;
}

@media (max-width: $MQMobileNarrow) {
  .package-section {
    .card-scroller {
      // The vue-virtual-scroller requires a fixed height to work properly.
      height: calc(100vh - $theme-default-content-margin-top-mobile);
      // Hide scrollbar on mobile
      --scrollbar-width: 0;
    }

    .column {
      &.col-card {
        width: 100%;
        flex: none;
      }
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
sort-by: Sort by
no-data-available: There are no packages available for this topic.
</i18n>

<i18n locale="zh-CN" lang="yaml">
sort-by: 排序
no-data-available: 此主题下没有可用的包。
</i18n>