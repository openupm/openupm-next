<script setup lang="ts">
interface Sponsor {
  text: string;
  slug: string;
  url: string;
  image?: string;
  minWidth?: string;
}

defineProps<{ profile: Sponsor }>();
</script>

<template>
  <div class="sponsor-item">
    <a :href="profile.url" rel="noopener" :aria-label="profile.text">
      <LazyImage
        v-if="profile.image"
        :src="profile.image"
        :alt="profile.text"
        :title="profile.text"
        class="img-responsive"
        :style="{ minWidth: profile.minWidth || '0' }"
      />
      <span class="hide">{{ profile.text }}</span>
    </a>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.sponsor-item {
  flex: 0 0 33.333%;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 10rem;
  padding: 0.25rem;
  margin-bottom: 0.5rem;
}

.sponsor-item a {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

@media (max-width: $MQMobileNarrow) {
  .sponsor-item {
    flex: 0 0 50%;
    max-width: none;
  }
}
</style>
