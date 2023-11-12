<script setup lang="ts">
import { capitalize, template } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import numeral from 'numeral';
import { computed } from 'vue';

import ParentLayout from "@/layouts/WideLayout.vue";
import { useDefaultStore } from '@/store';
import { usePageFrontmatter } from '@vuepress/client';
import { OpenUPMGitHubRepoUrl, getLocaleDocsPath } from '@openupm/common/build/urls.js';

const store = useDefaultStore();
const frontmatter = usePageFrontmatter();
const { t } = useI18n();

const guideLink = computed(() => {
  return {
    link: getLocaleDocsPath("/docs/"),
    text: capitalize(t("guide")),
  };
});

const githubLink = computed(() => {
  return {
    link: OpenUPMGitHubRepoUrl,
    text: "Stars " + store.formattedStars,
    icon: "fab fa-github",
    iconLeft: true
  };
});

const readyPackageCount = computed(() => {
  const num = store.readyPackageCount;
  return numeral(num).format("0,0");
});

const features = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (frontmatter.value as any).features as { title: string, desc: string }[];
  return items.map(item => {
    return {
      title: item.title,
      desc: template(item.desc)({ package_count: readyPackageCount.value }),
    };
  });
});
</script>

<template>
  <ParentLayout class="homepage">
    <template #page-content-top>

      <header class="hero">
        <div class="hero-body inner">
          <div>
            <h1 id="main-title">{{ frontmatter.heroText }}</h1>
            <p class="actions">
              <AutoLink class="btn btn-lg btn-default" :item="githubLink" />
              <AutoLink class="btn btn-lg btn-primary" :item="guideLink" />
            </p>
          </div>
        </div>
      </header>

      <div class="features">
        <div class="columns">
          <div v-for="(feature, index) in features" :key="index" class="feature-item col-4 col-md-12">
            <h3>{{ feature.title }}</h3>
            <ClientOnly>
              <p>{{ feature.desc }}</p>
            </ClientOnly>
          </div>
        </div>
      </div>
    </template>
  </ParentLayout>
</template>

<style lang="scss">
.homepage {
  .hero {
    .external-link-icon {
      display: none;
    }
  }
}
</style>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.homepage {
  .hero {
    padding-bottom: 0;

    .hero-body {
      text-align: center;
      margin: 0 auto;

      h1 {
        margin-bottom: 4rem;
        font-size: 1.8rem;
      }

      .actions {
        .btn {
          width: 9rem;
        }

        .btn:not(:last-child) {
          margin-right: 1rem;
        }
      }
    }
  }

  .features {
    border: none;
    margin-top: 0;
    margin-bottom: 2rem !important;
    // margin-bottom: 1rem;
    padding: 0;
    margin-bottom: 3rem;

    .feature-item {
      padding: 0 0.5rem 0 0;
    }

    h3 {
      font-weight: bold;
      font-size: 0.9rem;
      color: var(--c-brand);
    }

    .pkg-count {
      display: inline-block;
      min-width: 1.5rem;
      text-align: center;
    }
  }

  h3 {
    margin-top: 2rem;
  }
}

@media (max-width: $MQMobileNarrow) {
  .homepage {
    .hero {
      padding-top: 2rem;
      margin-bottom: 1rem;

      .hero-body {
        .actions {
          .btn {
            // width: auto;
            min-width: 7rem;
          }

          .btn:not(:last-child) {
            margin-right: 0.6rem;
          }
        }
      }
    }

    .features {
      padding: 0 1rem;

      h3 {
        margin-top: 1.5rem;
        padding-top: 0rem;
      }
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  guide: Guide
</i18n>

<i18n locale="zh-CN" lang="yaml">
  guide: 使用指南
</i18n>
