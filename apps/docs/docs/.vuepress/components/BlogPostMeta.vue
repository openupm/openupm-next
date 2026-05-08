<script setup lang="ts">
import { computed } from "vue";
import { usePageFrontmatter } from "vuepress/client";

const frontmatter = usePageFrontmatter();

const meta = computed(() => {
  const value = frontmatter.value as Record<string, string | undefined>;
  return {
    author: value.author,
    date: value.date,
    readingTime: value.readingTime,
    originalUrl: value.originalUrl,
  };
});
</script>

<template>
  <p class="blog-meta">
    {{ meta.date }} · {{ meta.author }} · {{ meta.readingTime }}
  </p>
  <p v-if="meta.originalUrl" class="blog-original">
    Originally published on
    <a :href="meta.originalUrl" rel="noopener noreferrer" target="_blank">
      Medium
    </a>
  </p>
</template>

<style scoped>
.blog-meta,
.blog-original {
  color: var(--c-text-light);
  font-size: 0.75rem !important;
}
</style>
