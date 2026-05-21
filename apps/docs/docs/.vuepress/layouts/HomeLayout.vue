<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

import ParentLayout from "@/layouts/WideLayout.vue";
import { useDefaultStore } from '@/store';
import { usePageFrontmatter } from '@vuepress/client';
import { OpenUPMGitHubRepoUrl } from '@openupm/common/build/urls.js';

const store = useDefaultStore();
const frontmatter = usePageFrontmatter();
const { t } = useI18n();

const capitalizeText = (text: string): string =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const guideLink = computed(() => {
  return {
    link: "/docs/",
    text: capitalizeText(t("guide")),
  };
});

const githubLink = computed(() => {
  return {
    link: OpenUPMGitHubRepoUrl,
    text: "Stars " + store.formattedStars,
    icon: "fab fa-github",
    iconLeft: true,
    className: "no-external-link-icon",
  };
});

const readyPackageCount = computed(() => {
  const num = store.siteInfo.readyPackageCount || 0;
  if (num > 0) return new Intl.NumberFormat("en-US").format(num);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallback = (frontmatter.value as any).readyPackageCountFallback;
  return typeof fallback === "string" ? fallback : "2,700+";
});

const features = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (frontmatter.value as any).features as {
    title: string;
    desc: string;
  }[];
  return items.map(item => {
    return {
      title: item.title,
      desc: item.desc.replace(
        /<%=\s*package_count\s*%>/g,
        readyPackageCount.value,
      ),
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
              <AutoLink class="btn btn-lg btn-default header-anchor" :item="guideLink" />
              <AutoLink class="btn btn-lg btn-primary header-anchor" :item="githubLink" />
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
@use '@/styles/palette' as *;
.homepage {

  .hero {
    .external-link.no-external-link-icon::after {
      content: none;
    }

    #main-title {
      font-size: 1.8rem;
    }
  }

  :is(.theme-default-content, [vp-content]) {
    h1 {
      font-weight: bold;
      background: -webkit-linear-gradient(315deg, $primary-color 10%, #2fc5cd);
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h2 {
      border-bottom: none;
      font-weight: bold;
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
    margin-bottom: 1.5rem !important;
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
            width: 7rem;
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
