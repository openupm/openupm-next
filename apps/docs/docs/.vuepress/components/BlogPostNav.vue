<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { getAdjacentBlogPosts, getBlogPostUrl } from "@/blog";

const route = useRoute();

const adjacent = computed(() => {
  const slug = route.path.split("/").filter(Boolean).at(-1);
  return slug ? getAdjacentBlogPosts(slug) : {};
});
</script>

<template>
  <nav class="blog-post-nav" aria-label="Blog post navigation">
    <RouterLink
      v-if="adjacent.previous"
      class="blog-post-nav__link"
      :to="getBlogPostUrl(adjacent.previous.slug)"
    >
      <span>
        <i class="fa fa-angle-double-left" aria-hidden="true"></i>
        Previous
      </span>
      {{ adjacent.previous.title }}
    </RouterLink>
    <RouterLink
      v-if="adjacent.next"
      class="blog-post-nav__link blog-post-nav__link--next"
      :to="getBlogPostUrl(adjacent.next.slug)"
    >
      <span>
        Next
        <i class="fa fa-angle-double-right" aria-hidden="true"></i>
      </span>
      {{ adjacent.next.title }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.blog-post-nav {
  border-top: 1px solid var(--c-border);
  display: grid;
  gap: 0.6rem;
  grid-template-columns: 1fr 1fr;
  margin-top: 2rem;
  padding-top: 1rem;
}

.blog-post-nav__link {
  background: var(--c-bg-light);
  border-radius: 4px;
  color: var(--c-text);
  font-size: 0.75rem;
  line-height: 1.35;
  padding: 0.65rem;
}

.blog-post-nav__link span {
  color: var(--c-text-light);
  display: block;
  font-size: 0.7rem;
  margin-bottom: 0.2rem;
}

.blog-post-nav__link .fa {
  font-size: 0.68rem;
}

.blog-post-nav__link--next {
  text-align: right;
}

@media (max-width: 719px) {
  .blog-post-nav {
    grid-template-columns: 1fr;
  }

  .blog-post-nav__link--next {
    text-align: left;
  }
}
</style>
