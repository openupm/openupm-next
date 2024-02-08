<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const priceNumber = computed(() => {
  return props.price.replace('$', '');
});
</script>

<template>
  <div class="ad-placement">
    <span class="ad-mark pl-1 pr-1">Ad</span>
    <div class="ad-img-container">
      <a :href="url" class="ad-img-link" rel="noopener nofollow" target="_blank">
        <img :src="image" alt="Ad Image" class="img-responsive" />
      </a>
    </div>
    <div class="ad-link-container">
      <div class="h5">
        <a :href="url" class="ad-link" rel="noopener nofollow" target="_blank">
          <span class="ad-title">{{ title }}</span>
        </a>
      </div>
      <span class="chip">
        <i class="fas fa-dollar-sign"></i>{{ priceNumber }}</span>
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
  overflow: hidden;
  /* 3:2 aspect ratio */
}

.ad-link-container {
  --card-content-padding-lr: 0.4rem;
  height: 4.17rem;
  padding: 0.3rem var(--card-content-padding-lr) 0;

  .h5 {
    font-size: $font-size-md;
    margin-bottom: 0.2rem;

    >a {
      font-weight: 600;
    }
  }

  .chip {
    font-size: $font-size-xs;
    height: 0.8rem;
  }
}

.dark {
  .ad-placement {
    box-shadow: none;
    background-color: var(--c-bg-light);
  }
}
</style>