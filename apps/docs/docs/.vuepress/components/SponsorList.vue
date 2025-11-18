<script setup lang="ts">
import { computed } from 'vue';

interface Sponsor {
  text: string;
  slug: string;
  url: string;
  image?: string;
  expires?: string;
  minWidth?: string;
}

const props = defineProps({
  items: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array<any>,
    default: () => []
  }
});

// Fisher-Yates shuffle algorithm for randomizing array order
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const sponsors = computed(() => {
  const filteredSponsors = props.items
    .filter((x: Sponsor) => {
      if (x.expires) {
        return Date.parse(x.expires) >= new Date().getTime();
      }
      return true;
    });
  
  // Shuffle the sponsors randomly on each page refresh
  // TODO: Re-enable shuffling once production issue is resolved
  // return shuffleArray(filteredSponsors);
  return filteredSponsors;
});
</script>

<template>
  <div class="sponsor-container">
    <div v-for="(profile, index) in sponsors" class="sponsor-item">
      <a :href="profile.url" rel="noopener" :aria-label="profile.text">
        <LazyImage v-if="profile.image" :src="profile.image" :alt="profile.text" :title="profile.text" class="img-responsive"
          :style="{ minWidth: profile.minWidth || '0' }" />
        <span class="hide">{{ profile.text }}</span>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sponsor-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: center;
  margin: 0 0 1.2rem 0;
}

.sponsor-item {
  flex: 0 0 33.333%;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 10rem;
  padding: 0.25rem;
  
  a {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
}
</style>
