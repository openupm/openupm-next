<script setup lang="ts">
import { AdPlacementData } from '@openupm/types';
import { PropType, computed } from 'vue';

const props = defineProps({
  data: {
    type: Object as PropType<AdPlacementData>,
    required: true,
  },
});

// Calculate the value of 5 - the average rating
const ratingAverageLeft = computed(() => {
  return 5 - (props.data.ratingAverage || 0);
});
</script>

<template>
  <div class="ad-placement">
    <span class="ad-mark pl-1 pr-1">Ad</span>
    <div class="ad-img-container">
      <a :href="data.url" class="ad-img-link" rel="noopener nofollow" target="_blank">
        <img :src="data.image" alt="Ad Image" class="img-responsive" />
      </a>
    </div>
    <div class="">
      <a :href="data.url" class="ad-link" rel="noopener nofollow" target="_blank">
        <span class="ad-title text-bold">{{ data.title }}</span>
      </a>
    </div>
    <div class="ad-meta">
      <template v-if="data.ratingAverage && data.ratingCount">
        <i class="fas fa-star" v-for="index in data.ratingAverage" :key="index"></i>
        <i class="far fa-star" v-for="index in ratingAverageLeft" :key="index"></i>
        <span class="pl-1 pr-2">({{ data.ratingCount }})</span>
      </template>
      <span class="ad-price text-bold">{{ data.price }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ad-placement {
  position: relative;
}

.ad-mark {
  top: 0;
  right: 0;
  color: var(--c-text-lighter);
  font-size: 0.7rem;
  position: absolute;
  background-color: var(--c-bg-darker);
}

.ad-img-link {
  display: block;
}

.ad-img-container {
  height: 0;
  padding-bottom: 66.67%;
  /* 3:2 aspect ratio*/
}

.ad-link,
.ad-meta {
  font-size: 0.7rem;
}

.ad-price {
  display: inline-block;
  color: var(--c-text-lighter);
}
</style>