<script setup lang="ts">
import { PropType } from "vue";

const props = defineProps({
  href: {
    type: String,
    required: true,
  },
  variant: {
    type: String as PropType<"sidebar" | "grid">,
    required: true,
  },
});
</script>

<template>
  <div :class="['kie-ad', `kie-ad-${props.variant}`, 'no-external-link-icon']">
    <span class="kie-ad-label">Ad · Affiliate</span>
    <a
      :href="props.href"
      class="kie-ad-link no-external-link-icon"
      rel="sponsored nofollow noopener"
      target="_blank"
    >
      <span v-if="props.variant === 'grid'" class="kie-ad-media" aria-hidden="true">
        <span class="kie-ad-wordmark">KIE.ai</span>
      </span>
      <span class="kie-ad-body">
        <span class="kie-ad-title">KIE.ai</span>
        <span class="kie-ad-description">AI video, image and music models in one API</span>
        <span class="kie-ad-cta">Explore KIE <i class="fas fa-arrow-right"></i></span>
      </span>
    </a>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.kie-ad {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  box-sizing: border-box;
  position: relative;

  .no-external-link-icon::after,
  :deep(.external-link-icon) {
    content: none !important;
    display: none !important;
  }
}

.kie-ad-label {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  padding: 0.05rem 0.3rem;
  color: var(--c-text-lighter);
  background: var(--c-bg-darker);
  font-size: 0.65rem;
  line-height: 1.4;
}

.kie-ad-link {
  color: inherit;
  display: block;
  text-decoration: none;
  border-bottom: none;

  &:hover,
  &:focus {
    color: inherit;
    text-decoration: none;
    border-bottom: none;
  }

  :deep(span) {
    text-decoration: none;
    border-bottom: none;
  }
}

.kie-ad-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.kie-ad-title {
  color: var(--c-text);
  font-weight: 700;
}

.kie-ad-description {
  color: var(--c-text-lighter);
  line-height: 1.25;
}

.kie-ad-cta {
  color: $primary-color;
  font-weight: 600;
  white-space: nowrap;
}

.kie-ad-sidebar {
  margin: 0.5rem;
  padding: 0.45rem 0.55rem 0.55rem;
  border-radius: 0.35rem;

  .kie-ad-title {
    font-size: 0.78rem;
  }

  .kie-ad-description {
    font-size: 0.68rem;
  }

  .kie-ad-cta {
    font-size: 0.68rem;
    margin-top: 0.15rem;
  }
}

.kie-ad-grid {
  height: 100%;
  border-radius: 0.35rem;
  box-shadow: 0 0.35rem 0.9rem rgba(34, 48, 74, 0.1);
  overflow: hidden;

  .kie-ad-link {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .kie-ad-media {
    align-items: center;
    aspect-ratio: 2 / 1;
    background: linear-gradient(135deg, #1f2a44 0%, #3d5afe 100%);
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .kie-ad-wordmark {
    color: #fff;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .kie-ad-body {
    flex: 1;
    padding: 0.55rem 0.6rem 0.6rem;
  }

  .kie-ad-title {
    font-size: $font-size-md;
  }

  .kie-ad-description {
    font-size: $font-size-sm;
    min-height: 2rem;
  }

  .kie-ad-cta {
    font-size: $font-size-sm;
    margin-top: auto;
  }
}

:is(.dark, [data-theme='dark']) {
  .kie-ad-cta {
    color: $primary-color-light;
  }
}
</style>
