<script setup lang="ts">
import { computed, PropType } from "vue";
import { useRoute } from "vue-router";
import { usePageData } from "@vuepress/client";

type BreadcrumbItem = {
  link?: string;
  text: string;
};

const props = defineProps({
  items: {
    type: Array as PropType<BreadcrumbItem[]>,
    default: () => [],
  },
});

const route = useRoute();
const page = usePageData();

const normalizeTitle = (title: string): string =>
  title
    .replace(/\s+\|\s+OpenUPM(?:\s+Unity Package)?$/, "")
    .replace(/^OpenUPM\s+/, "")
    .trim();

const inferItems = (): BreadcrumbItem[] => {
  const path = route.path;
  const title = normalizeTitle(page.value.title || "");

  if (path === "/") return [];
  if (path === "/packages/") return [{ text: "Packages" }];
  if (path.startsWith("/packages/topics/")) {
    return [
      { text: "Packages", link: "/packages/" },
      { text: title.replace(/\s+Unity Packages$/, "") || "Topic" },
    ];
  }
  if (path.startsWith("/packages/")) {
    return [{ text: "Packages", link: "/packages/" }, { text: title }];
  }
  if (path === "/blog/") return [{ text: "Blog" }];
  if (path.startsWith("/blog/")) {
    return [{ text: "Blog", link: "/blog/" }, { text: title }];
  }
  if (path === "/docs/") return [{ text: "Docs" }];
  if (path.startsWith("/docs/")) {
    return [{ text: "Docs", link: "/docs/" }, { text: title }];
  }
  if (path === "/nuget/") return [{ text: "NuGet Packages" }];
  if (path === "/contributors/") return [{ text: "Contributors" }];
  if (path === "/support/") return [{ text: "Support" }];

  return title ? [{ text: title }] : [];
};

const breadcrumbItems = computed(() =>
  props.items.length ? props.items : inferItems(),
);

const visibleBreadcrumbItems = computed(() => {
  const items = breadcrumbItems.value;
  if (!items.length) return [];
  if (items[0]?.link === "/") return items;
  return [{ text: "Home", link: "/" }, ...items];
});
</script>

<template>
  <nav v-if="visibleBreadcrumbItems.length" aria-label="Breadcrumb" class="site-breadcrumb">
    <ul class="breadcrumb">
      <li
        v-for="(item, index) in visibleBreadcrumbItems"
        :key="`${item.text}-${index}`"
        class="breadcrumb-item"
      >
        <RouterLink v-if="item.link" :to="item.link">{{ item.text }}</RouterLink>
        <span v-else aria-current="page">{{ item.text }}</span>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss" scoped>
.site-breadcrumb {
  margin-bottom: 0.4rem;

  .breadcrumb {
    margin: 0;
  }
}
</style>
