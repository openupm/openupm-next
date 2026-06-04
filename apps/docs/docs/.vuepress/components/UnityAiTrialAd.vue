<script setup lang="ts">
import { computed } from "vue";

const unityAiTrialUrl = "https://unity.com/features/ai?aid=1011lJJH";
const campaignEnd = new Date("2026-07-01T00:00:00");

const props = defineProps<{
  variant: "navbar";
}>();

const isActive = computed(() => new Date() < campaignEnd);
</script>

<template>
  <a
    v-if="isActive"
    :href="unityAiTrialUrl"
    :class="['unity-ai-trial-ad', `unity-ai-trial-ad-${props.variant}`]"
    rel="noopener nofollow"
    target="_blank"
  >
    <span class="unity-ai-trial-ad-copy">Try Unity AI FREE ✨</span>
  </a>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.unity-ai-trial-ad {
  align-items: center;
  color: $primary-color;
  display: inline-flex;
  font-weight: 600;
  gap: 0.35rem;
  text-decoration: none;

  &:hover {
    color: $primary-color;
    text-decoration: none;
  }
}

.unity-ai-trial-ad-navbar {
  border: 1px solid rgba($primary-color, 0.25);
  border-radius: 999px;
  font-size: 0.68rem;
  line-height: 1;
  margin-left: 0.55rem;
  max-width: 8.5rem;
  min-height: 1.35rem;
  padding: 0.25rem 0.45rem;
  white-space: nowrap;

  @media screen and (max-width: $MQMobile) {
    display: none;
  }

  &:hover {
    border-color: rgba($primary-color, 0.45);
  }
}

.unity-ai-trial-ad-copy {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

:is(.dark, [data-theme='dark']) {
  .unity-ai-trial-ad {
    color: $primary-color-light;

    &:hover {
      color: $primary-color-light;
    }
  }

  .unity-ai-trial-ad-navbar {
    border-color: rgba($primary-color-light, 0.35);

    &:hover {
      border-color: rgba($primary-color-light, 0.55);
    }
  }
}
</style>
