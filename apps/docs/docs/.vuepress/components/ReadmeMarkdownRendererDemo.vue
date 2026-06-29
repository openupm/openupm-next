<script setup lang="ts">
import { computed, ref } from "vue";

import PackageReadmeView from "@/components/PackageReadmeView.vue";
import { readmeMarkdownDemoFixtures } from "@/readmeMarkdownDemoData";

const selectedTitle = ref(readmeMarkdownDemoFixtures[0]?.title || "");

const selectedFixture = computed(() => {
  return (
    readmeMarkdownDemoFixtures.find(fixture => fixture.title === selectedTitle.value) ||
    readmeMarkdownDemoFixtures[0]
  );
});

const syntheticFixtures = computed(() => {
  return readmeMarkdownDemoFixtures.filter(fixture => fixture.kind === "Synthetic");
});

const liveFixtures = computed(() => {
  return readmeMarkdownDemoFixtures.filter(fixture => fixture.kind === "Live README");
});

const fixtureSlug = (title: string): string => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};
</script>

<template>
  <div class="readme-markdown-demo">
    <div class="demo-shell">
      <aside class="demo-nav" aria-label="README markdown fixtures">
        <h2>Synthetic</h2>
        <button
          v-for="fixture in syntheticFixtures"
          :key="fixture.title"
          class="btn btn-link demo-nav-item"
          :class="{ active: fixture.title === selectedFixture.title }"
          type="button"
          @click="selectedTitle = fixture.title"
        >
          {{ fixture.title }}
        </button>

        <h2>Live README</h2>
        <button
          v-for="fixture in liveFixtures"
          :key="fixture.title"
          class="btn btn-link demo-nav-item"
          :class="{ active: fixture.title === selectedFixture.title }"
          type="button"
          @click="selectedTitle = fixture.title"
        >
          {{ fixture.title }}
        </button>
      </aside>

      <section v-if="selectedFixture" class="demo-content">
        <header class="demo-header">
          <div>
            <p class="demo-kind">{{ selectedFixture.kind }}</p>
            <h2>{{ selectedFixture.title }}</h2>
            <p v-if="selectedFixture.kind === 'Live README'" class="demo-source">
              <a :href="selectedFixture.repoUrl" rel="noopener noreferrer" target="_blank">
                {{ selectedFixture.packageName }}
              </a>
              <span aria-hidden="true"> · </span>
              <a :href="selectedFixture.sourceUrl" rel="noopener noreferrer" target="_blank">
                source markdown
              </a>
            </p>
            <p v-else class="demo-source">
              Generated local fixture using a synthetic package context for URL rewriting checks.
            </p>
          </div>
          <p
            v-if="selectedFixture.kind === 'Live README'"
            class="demo-fetch-state"
            :class="{ warning: !selectedFixture.fetched }"
          >
            {{ selectedFixture.fetched ? "Fetched from raw GitHub content" : `Fallback sample: ${selectedFixture.fetchError}` }}
          </p>
        </header>

        <details class="demo-source-markdown">
          <summary>Markdown source</summary>
          <pre><code>{{ selectedFixture.markdown }}</code></pre>
        </details>

        <div class="demo-comparison">
          <article class="demo-pane" data-test="before-pane">
            <h3>Before: legacy marked renderer</h3>
            <PackageReadmeView
              :name="selectedFixture.packageName"
              :readme-html="selectedFixture.legacyHtml"
              :is-loading="false"
            />
          </article>
          <article
            class="demo-pane"
            data-test="after-pane"
            :data-fixture="fixtureSlug(selectedFixture.title)"
          >
            <h3>After: local GFM renderer</h3>
            <PackageReadmeView
              :name="selectedFixture.packageName"
              :readme-html="selectedFixture.currentHtml"
              :is-loading="false"
            />
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/palette" as *;

:global(.vp-theme-container.wide-layout.no-sidebar .vp-sidebar),
:global(.vp-theme-container.wide-layout.no-sidebar .vp-sidebar-mask) {
  display: none;
}

.readme-markdown-demo {
  margin-top: 1rem;
}

.demo-shell {
  align-items: flex-start;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
}

.demo-nav {
  border-right: 1px solid $border-color;
  padding-right: 1rem;
  position: sticky;
  top: calc(var(--navbar-height) + 1rem);

  h2 {
    font-size: 0.8rem;
    margin: 0.8rem 0 0.4rem;
    padding: 0;
    text-transform: uppercase;
  }
}

.demo-nav-item {
  display: block;
  height: auto;
  line-height: 1.25;
  margin: 0 0 0.25rem;
  padding: 0.25rem 0;
  text-align: left;
  white-space: normal;
  width: 100%;

  &.active {
    color: var(--c-text-accent);
    font-weight: 600;
  }
}

.demo-content {
  min-width: 0;
}

.demo-header {
  align-items: flex-start;
  border-bottom: 1px solid $border-color;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;

  h2 {
    margin: 0 0 0.3rem;
    padding: 0;
  }
}

.demo-kind,
.demo-source,
.demo-fetch-state {
  color: $gray-color;
  font-size: 0.72rem;
  margin: 0;
}

.demo-kind {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.demo-fetch-state {
  flex: 0 0 13rem;
  text-align: right;

  &.warning {
    color: var(--c-warning);
  }
}

.demo-source-markdown {
  margin-bottom: 1rem;

  pre {
    max-height: 18rem;
  }
}

.demo-comparison {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.demo-pane {
  border: 1px solid $border-color;
  border-radius: 6px;
  min-width: 0;
  padding: 0.8rem;

  h3 {
    border-bottom: 1px solid $border-color;
    font-size: 0.9rem;
    margin: 0 0 0.8rem;
    padding: 0 0 0.5rem;
  }
}

@media (max-width: 959px) {
  .demo-shell,
  .demo-comparison {
    grid-template-columns: 1fr;
  }

  .demo-nav {
    border-right: 0;
    border-bottom: 1px solid $border-color;
    padding: 0 0 0.8rem;
    position: static;
  }

  .demo-header {
    display: block;
  }

  .demo-fetch-state {
    margin-top: 0.5rem;
    text-align: left;
  }
}
</style>
