<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

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

const filteredSponsors = computed(() => props.items.filter((x: Sponsor) => {
  if (x.expires) {
    return Date.parse(x.expires) >= new Date().getTime();
  }
  return true;
}));

const sponsors = computed(() => filteredSponsors.value);
const randomizedSponsors = ref<Sponsor[]>(filteredSponsors.value);
const hasHydrated = ref(false);

const shuffleAndStore = (source = filteredSponsors.value) => {
  randomizedSponsors.value = shuffleArray(source);
};

onMounted(async () => {
  await nextTick();
  hasHydrated.value = true;
  shuffleAndStore(filteredSponsors.value);
  watch(
    filteredSponsors,
    (nextSponsors) => shuffleAndStore(nextSponsors),
    { immediate: false },
  );
});
</script>

<template>
  <div>
    <div v-if="hasHydrated" key="client" class="sponsor-container">
      <SponsorItem v-for="profile in randomizedSponsors" :key="profile.slug" :profile="profile" />
    </div>
    <div v-else key="server" class="sponsor-container">
      <SponsorItem v-for="profile in sponsors" :key="profile.slug" :profile="profile" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.sponsor-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: center;
  margin: 0 0 1.2rem 0;
}

@media (max-width: $MQMobileNarrow) {
  .sponsor-container {
    justify-content: flex-start;
  }
}
</style>
