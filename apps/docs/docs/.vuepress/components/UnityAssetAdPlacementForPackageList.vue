<script setup lang="ts">
import { AdPlacementData } from '@openupm/types';
import { PropType, computed } from 'vue';

const props = defineProps({
  data: {
    type: Object as PropType<AdPlacementData>,
    required: true,
  },
});

// Remove the dollar sign from the price
const priceNumber = computed(() => {
  return props.data.price.replace('$', '');
});

// Remove the dollar sign from the original price
const originalPriceNumber = computed(() => {
  return props.data.originalPrice.replace('$', '');
});

// Calculate the value of 5 - the average rating
const ratingAverageLeft = computed(() => {
  return 5 - (props.data.ratingAverage || 0);
});

// has discount
const hasDiscount = computed(() => {
  return props.data.originalPrice && props.data.price && props.data.originalPrice !== props.data.price;
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
    <div class="ad-link-container">
      <div class="h5">
        <a :href="data.url" class="ad-link" rel="noopener nofollow" target="_blank">
          <span class="ad-title">{{ data.title }}</span>
        </a>
      </div>
      <span class="chip">
        <i class="fas fa-dollar-sign"></i>{{ priceNumber }}<del class="pl-2" v-if="hasDiscount">{{ originalPriceNumber
        }}</del></span>
      <span v-if="data.ratingAverage && data.ratingCount" class="chip">
        <i class="fas fa-star" v-for="index in data.ratingAverage" :key="index"></i>
        <i class="far fa-star" v-for="index in ratingAverageLeft" :key="index"></i>
        <span class="pl-1">{{ data.ratingCount }}</span></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.ad-placement {
  position: relative;
  box-shadow: 0 .25rem .5rem var(--c-border);
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
  /* 3:2 aspect ratio */
  overflow-y: hidden;
}

.ad-link-container {
  --card-content-padding-lr: 0.4rem;
  height: 4.17rem;
  padding: 0.3rem var(--card-content-padding-lr) 0;

  .h5 {
    font-size: $font-size-md;
    margin-bottom: 0.2rem;
    max-height: 2.2rem;
    overflow: hidden;
    text-overflow: ellipsis;

    >a {
      font-weight: 600;
    }
  }

  .chip {
    font-size: $font-size-xs;
    height: 0.8rem;

    .fas.fa-star,
    .far.fa-star {
      margin-right: 0.05rem;
    }
  }
}

.dark {
  .ad-placement {
    box-shadow: none;
    background-color: var(--c-bg-light);
  }
}
</style>