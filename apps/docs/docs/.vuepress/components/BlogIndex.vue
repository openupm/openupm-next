<script setup lang="ts">
import {
  BLOG_RSS_PATH,
  getBlogPostUrl,
  getBlogPostsNewestFirst,
} from "@/blog";

const posts = getBlogPostsNewestFirst();
const abstractImages = [
  "/images/blog-abstract-registry.svg",
  "/images/blog-abstract-release.svg",
  "/images/blog-abstract-code.svg",
];

const getFeaturedImage = (post: (typeof posts)[number], index: number): string =>
  post.featuredImage ?? abstractImages[index % abstractImages.length];
</script>

<template>
  <div class="blog-index">
    <p class="blog-index__intro">
      OpenUPM project updates, package manager notes, and Unity package
      publishing guides.
    </p>

    <p>
      <a :href="BLOG_RSS_PATH" class="blog-rss-link">
        <i class="fa fa-rss-square" aria-hidden="true"></i>
        RSS feed
      </a>
    </p>

    <div class="blog-grid">
      <article
        v-for="(post, index) in posts"
        :key="post.slug"
        class="blog-entry"
      >
        <RouterLink :to="getBlogPostUrl(post.slug)" class="blog-entry__media">
          <img :alt="post.title" :src="getFeaturedImage(post, index)" />
        </RouterLink>
        <div class="blog-entry__body">
          <h2>
            <RouterLink :to="getBlogPostUrl(post.slug)">
              {{ post.title }}
            </RouterLink>
          </h2>
          <p class="blog-entry__summary">{{ post.excerpt }}</p>
          <p class="blog-meta">
            {{ post.date }} · {{ post.author }} · {{ post.readingTime }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.blog-index__intro {
  color: var(--c-text-light);
}

.blog-rss-link :deep(.fa) {
  margin-right: 0.3rem;
}

.blog-grid {
  display: grid;
  column-gap: 1.6rem;
  row-gap: 2rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.blog-entry {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.blog-entry__media {
  aspect-ratio: 16 / 9;
  background: var(--c-bg-light);
  display: block;
  overflow: hidden;
}

.blog-entry__media img {
  display: block;
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.blog-entry__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0;
}

.blog-entry__body h2 {
  border-bottom: 0 !important;
  font-size: 1rem;
  line-height: 1.3;
  margin: 0.42rem 0 !important;
  padding: 0 !important;
}

.blog-entry__body h2:first-child + p {
  margin-top: 0 !important;
}

.blog-entry__body h2 :deep(a),
.blog-entry__body h2 :deep(a.route-link),
.blog-entry__body h2 :deep(a:hover) {
  border-bottom: 0 !important;
  box-shadow: none !important;
  text-decoration: none !important;
}

.blog-entry__summary {
  flex: 1;
  font-size: 0.7rem;
  line-height: 1.45;
  margin: 0 0 0.2rem;
}

.blog-entry .blog-meta {
  color: var(--c-text-light);
  font-size: 0.7rem !important;
  margin: 0;
}

@media (max-width: 719px) {
  .blog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
