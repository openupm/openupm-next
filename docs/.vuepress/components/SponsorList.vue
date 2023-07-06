<script setup lang="ts">
import { computed } from 'vue';
import GitHubAvatar from '@/components/GitHubAvatar.vue';
import LazyImage from '@/components/LazyImage.vue';

interface Sponsor {
  text: string;
  slug: string;
  // GitHub entry
  githubUser?: string;
  abbr?: string;
  // General entry
  url?: string;
  image?: string;
  // Other props
  expires?: string;
  minWidth?: string;
}

const props = defineProps({
  level: {
    type: String,
    required: true
  },
  items: {
    type: Array<any>,
    default: () => []
  }
});

const classList = computed(() => ["sponsor-item", "sponsor-" + props.level]);

const sponsors = computed(() => {
  return props.items
    .filter((x: Sponsor) => {
      if (x.expires) {
        return Date.parse(x.expires) >= new Date().getTime();
      }
      return true;
    })
});
</script>

<template>
  <div class="sponsor-container">
    <div v-for="(profile, index) in sponsors" :key="index" :class="classList">
      <GitHubAvatar v-if="profile.githubUser" :profile="profile" />
      <a v-else :href="profile.url">
        <LazyImage v-if="profile.image" :src="profile.image" :alt="profile.text" class="img-responsive"
          :style="{ minWidth: profile.minWidth || '0' }" />
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sponsor-container {
  margin: 0 0 1.2rem 0;
}

.sponsor-item {
  display: inline-block;
  vertical-align: middle;
  margin: 0 0.5rem 0.5rem 0;
  max-width: 10rem;

  &.sponsor-diamond {
    max-width: 15rem;
  }

  &.sponsor-gold {
    max-width: 15rem;
  }

  &.sponsor-silver {
    max-width: 12rem;
  }

  &.sponsor-bronze {
    max-width: 9rem;
  }

  &.sponsor-service {
    max-width: 9rem;
  }
}
</style>
