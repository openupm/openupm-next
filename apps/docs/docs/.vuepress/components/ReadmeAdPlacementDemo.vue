<script setup lang="ts">
import { computed, ref } from "vue";

import PackageReadmeView from "@/components/PackageReadmeView.vue";

type DemoFixture = {
  title: string;
  summary: string;
  html: string;
};

const paragraph = (index: number): string =>
  `<p>Package README paragraph ${index} describes installation context, examples, compatibility notes, and practical usage details with enough body text to approximate real package documentation density.</p>`;

const section = (
  title: string,
  startIndex: number,
  paragraphCount: number,
): string => {
  const paragraphs = Array.from({ length: paragraphCount }, (_, index) =>
    paragraph(startIndex + index),
  ).join("");
  return `<h2>${title}</h2>${paragraphs}`;
};

const fixtures: DemoFixture[] = [
  {
    title: "Balanced Sections",
    summary: "Frequent headings with moderate body copy between sections.",
    html: `<div>
      <h1>Balanced README</h1>
      ${section("Install", 1, 5)}
      ${section("Quick Start", 6, 7)}
      ${section("Configuration", 13, 8)}
      ${section("Advanced Usage", 21, 9)}
      ${section("Troubleshooting", 30, 5)}
    </div>`,
  },
  {
    title: "Long Opening",
    summary: "A long introduction before the first useful section heading.",
    html: `<div>
      <h1>Long Opening README</h1>
      ${Array.from({ length: 15 }, (_, index) => paragraph(index + 1)).join("")}
      ${section("Installation", 16, 5)}
      ${section("Examples", 21, 7)}
      ${section("Reference", 28, 8)}
    </div>`,
  },
  {
    title: "Sparse Headings",
    summary: "Long content with only one late section boundary.",
    html: `<div>
      <h1>Sparse README</h1>
      ${Array.from({ length: 22 }, (_, index) => paragraph(index + 1)).join("")}
      ${section("Appendix", 23, 4)}
    </div>`,
  },
  {
    title: "No Sections",
    summary:
      "Long content without section headings, showing the fallback placement.",
    html: `<div>
      <h1>No Section README</h1>
      ${Array.from({ length: 26 }, (_, index) => paragraph(index + 1)).join("")}
    </div>`,
  },
];

const selectedTitle = ref(fixtures[0].title);

const selectedFixture = computed(
  () =>
    fixtures.find((fixture) => fixture.title === selectedTitle.value) ||
    fixtures[0],
);
</script>

<template>
  <div class="readme-ad-placement-demo">
    <nav class="demo-tabs" aria-label="README ad placement fixtures">
      <button
        v-for="fixture in fixtures"
        :key="fixture.title"
        class="btn btn-link demo-tab"
        :class="{ active: fixture.title === selectedFixture.title }"
        type="button"
        @click="selectedTitle = fixture.title"
      >
        {{ fixture.title }}
      </button>
    </nav>

    <section class="demo-layout">
      <aside class="demo-notes">
        <p class="demo-label">Fixture</p>
        <h2>{{ selectedFixture.title }}</h2>
        <p>{{ selectedFixture.summary }}</p>
        <dl>
          <div>
            <dt>Package</dt>
            <dd>com.openupm.readme-ad-demo</dd>
          </div>
          <div>
            <dt>Renderer</dt>
            <dd>PackageReadmeView</dd>
          </div>
        </dl>
      </aside>

      <article class="demo-readme">
        <PackageReadmeView
          name="com.openupm.readme-ad-demo"
          :readme-html="selectedFixture.html"
          :is-loading="false"
        />
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/palette" as *;

.readme-ad-placement-demo {
  margin-top: 1rem;
}

.demo-tabs {
  border-bottom: 1px solid $border-color;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

.demo-tab {
  border-radius: 4px;
  line-height: 1.2;
  padding: 0.35rem 0.55rem;

  &.active {
    background: var(--c-bg-darker);
    color: var(--c-text-accent);
    font-weight: 600;
  }
}

.demo-layout {
  align-items: flex-start;
  display: grid;
  gap: 1.2rem;
  grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);
}

.demo-notes {
  border-right: 1px solid $border-color;
  padding-right: 1rem;
  position: sticky;
  top: calc(var(--navbar-height) + 1rem);

  h2 {
    font-size: 1.1rem;
    margin: 0 0 0.45rem;
    padding: 0;
  }

  p {
    color: $gray-color;
    font-size: 0.78rem;
    margin: 0 0 0.8rem;
  }

  dl {
    margin: 0;
  }

  div {
    margin-bottom: 0.5rem;
  }

  dt {
    color: $gray-color;
    font-size: 0.68rem;
    text-transform: uppercase;
  }

  dd {
    font-size: 0.78rem;
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.demo-label {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.demo-readme {
  min-width: 0;
}

@media (max-width: 719px) {
  .demo-layout {
    grid-template-columns: 1fr;
  }

  .demo-notes {
    border-right: 0;
    border-bottom: 1px solid $border-color;
    padding: 0 0 0.8rem;
    position: static;
  }
}
</style>
