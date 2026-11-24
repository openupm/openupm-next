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
    <span class="kie-ad-label">Affiliate</span>
    <a
      :href="props.href"
      class="kie-ad-link no-external-link-icon"
      rel="sponsored nofollow noopener"
      target="_blank"
    >
      <span v-if="props.variant === 'grid'" class="kie-ad-media">
        <img class="kie-ad-logo" src="/images/ads/kie-logo.png" alt="KIE.ai" />
        <span class="kie-ad-badge">UP TO 88% OFF</span>
      </span>
      <span class="kie-ad-body">
        <span v-if="props.variant === 'sidebar'" class="kie-ad-heading">
          <img class="kie-ad-logo kie-ad-logo-small" src="/images/ads/kie-logo.png" alt="" />
          <span class="kie-ad-title">KIE.ai</span>
        </span>
        <span v-else class="kie-ad-title">KIE.ai</span>
        <span class="kie-ad-description">
          <span>Up to 88% off official AI API prices</span>
          <span>200+ models · 80 free credits{{ props.variant === 'sidebar' ? ' to start' : '' }}</span>
        </span>
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
  color: #fff;
  background: rgba(15, 23, 42, 0.82);
  border-bottom-left-radius: 0.25rem;
  font-size: 0.65rem;
  line-height: 1.4;
}

.kie-ad-link {
  color: inherit;
  display: block;
  text-decoration: none !important;
  border-bottom: none !important;

  &:hover,
  &:focus,
  &:active {
    color: inherit;
    text-decoration: none !important;
    border-bottom: none !important;
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
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  line-height: 1.25;
}

.kie-ad-heading {
  align-items: center;
  display: flex;
  gap: 0.35rem;
}

.kie-ad-logo {
  display: block;
  height: auto;
  width: 100%;
}

.kie-ad-logo-small {
  background: #fff;
  border-radius: 50%;
  box-sizing: content-box;
  height: 18px;
  padding: 2px;
  width: 18px;
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
    background: radial-gradient(circle at 50% 38%, #ffffff 0%, #eef4ff 62%, #dfe9ff 100%);
    display: flex;
    justify-content: center;
    position: relative;
    width: 100%;
  }

  .kie-ad-logo {
    max-width: 120px;
    width: 42%;
  }

  .kie-ad-badge {
    background: #1554ff;
    border-radius: 0.2rem;
    bottom: 0.5rem;
    color: #fff;
    font-size: 0.62rem;
    font-weight: 800;
    left: 0.5rem;
    letter-spacing: 0.02em;
    line-height: 1.4;
    padding: 0.18rem 0.4rem;
    position: absolute;
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
