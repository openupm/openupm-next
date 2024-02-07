<script setup lang="ts">
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
</script>

<template>
  <div class="ad-placement">
    <span class="ad-mark pl-1 pr-1">Ad</span>
    <div class="ad-img-container">
      <a :href="url" class="ad-img-link" rel="noopener nofollow" target="_blank">
        <img :src="image" alt="Ad Image" class="img-responsive" />
      </a>
    </div>
    <div class="">
      <a :href="url" class="ad-link" rel="noopener nofollow" target="_blank">
        <span class="ad-title">{{ title }}</span>
      </a>
      <span class="ad-price pl-1">{{ price }}</span>
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

ad-img-container {
  height: 0;
  padding-bottom: 66.67%;
  /* 2/3 aspect ratio (3:2) */
}

.ad-link {
  font-size: 0.7rem;
}

.ad-price {
  display: inline-block;
  color: var(--c-text-lighter);
}
</style>