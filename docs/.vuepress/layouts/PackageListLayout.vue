<script setup lang="ts">
import { orderBy, capitalize } from "lodash-es";
import { computed, watch, onMounted, ref } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
import { useMq } from "vue3-mq";
import { usePageFrontmatter } from "@vuepress/client";

import ParentLayout from "@/layouts/WideLayout.vue";
import { SortType } from "@/constant";
import PackageCard from "@/components/PackageCard.vue";
import PlaceholderLoader from '@/components/PlaceholderLoader.vue';
import { useDefaultStore } from '@/store';
import { Topic } from "@shared/types";
import { getPackageMetadata } from "@shared/utils";
import { translateFallback } from "@/utils";
import { getPackageListPagePath, isPackageListPath } from "@shared/urls";

const route = useRoute();
const router = useRouter();
const store = useDefaultStore();
const { t } = useI18n();
const mq = useMq();
const frontmatter = usePageFrontmatter();

const sortType = ref(SortType.downloads)

const sortTypeList = computed(() => [
  { text: capitalize(t("name")), value: SortType.name },
  { text: capitalize(t("github-stars")), value: SortType.pop },
  { text: capitalize(t("last-publish")), value: SortType.updatedAt },
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

const topic = computed(() => {
  return frontmatter.value.topic as Topic;
});

const topics = computed(() => {
  const topics = frontmatter.value.topics as Topic[];
  return topics
    .filter((x) => x.count > 0)
    .map((x) => {
      const tkey = x.slug || "all";
      const tvalue = t(tkey);
      return {
        link: x.urlPath,
        text: translateFallback(t, x.slug || "all", x.name),
        value: x.slug,
        class: x.slug == topic.value.slug ? "active" : "",
      };
    });
});

const metadataList = computed(() => {
  // Join extra data
  const topic = frontmatter.value.topic as Topic;
  let items = (topic.metadataList || []).map((metadataLocal) => {
    const metadataRemote = store.packageMetadataRemoteList[metadataLocal.name];
    return getPackageMetadata(metadataLocal, metadataRemote);
  });
  // Filter packages with versions.
  items = items.filter((metadata) => metadata.ver);
  // Sort
  if (sortType.value == SortType.updatedAt)
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
  return !metadataList.value.length;
});

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
    path: getPackageListPagePath(topic.value.slug),
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
            <div v-for="item in topics" :key="item.value" class="column col-12">
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
            <div v-else class="columns">
              <div v-for="metadata in metadataList" :key="metadata.name" v-memo="[metadata]" class="column col-card">
                <PackageCard :metadata="metadata" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </ParentLayout>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.package-section {
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
</i18n>

<i18n locale="zh-CN" lang="yaml">
sort-by: 排序
</i18n>