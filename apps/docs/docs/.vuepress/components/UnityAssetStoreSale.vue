<script setup lang="ts">
import { computed } from 'vue';

const candidates = [
  {
    title: 'Lunar New Year Sale',
    url: 'https://assetstore.unity.com/?aid=1011lJJH',
    image: '/images/ads/lny-320x100.jpg',
    start: "February 1, 2024, 8:00:00 GMT-0800",
    end: "February 14, 2024, 7:59:00 GMT-0800"
  },
  {
    title: 'Asset Refresh Sale',
    url: 'https://assetstore.unity.com/?on_sale=true&orderBy=1&rows=96&aid=1011lJJH',
    image: '/images/ads/fresh assets-320x100.png',
    start: "February 14, 2024, 8:00:00 GMT-0800",
    end: "February 28, 2024, 7:59:00 GMT-0800"
  },
  {
    title: 'March Flash Deals',
    url: 'https://assetstore.unity.com/?flashdeals=true&aid=1011lJJH',
    image: '/images/ads/flash deals-320x100.png',
    start: "March 7, 2024, 8:00:00 GMT-0800",
    end: "March 14, 2024, 7:59:00 GMT-0800"
  },
  {
    title: 'Spring Sale',
    url: 'https://assetstore.unity.com/?flashdeals=true&aid=1011lJJH',
    image: '/images/ads/ss-affiliate-320x100.png',
    start: "April 17, 2024, 8:00:00 GMT-0800",
    end: "May 8, 2024, 7:59:00 GMT-0800"
  },
  {
    title: 'Template Toolkit Sale',
    url: 'https://assetstore.unity.com/?on_sale=true&orderBy=1&rows=96&aid=1011lJJH',
    image: '/images/ads/template-toolkit-sale-336x280.png',
    start: "May 29, 2024, 8:00:00 GMT-0800",
    end: "June 12, 2024, 7:59:00 GMT-0800"
  },
  {
    title: 'Template Toolkit Sale',
    url: 'https://assetstore.unity.com/?on_sale=true&orderBy=1&rows=96&aid=1011lJJH',
    image: 'https://gen-as-admin-prd.storage.googleapis.com/genesis-admin-banners/banner-3aef9db7-0f45-4d83-af7b-23326014a6b0',
    start: "June 12, 2024, 8:00:00 GMT-0800",
    end: "June 26, 2024, 7:59:00 GMT-0800"
  },
].reverse();

const ad = computed(() => {
  const now = new Date();
  return candidates.find((x) => {
    const start = new Date(x.start);
    const end = new Date(x.end);
    return start <= now && now < end;
  });
});
</script>

<template>
  <section v-if="ad" class="sidebarad-section ml-2 mr-2 mt-2">
    <div class="columns">
      <div class="column col-12">
        <span class="ad-mark pl-1 pr-1">Ad</span>
        <a :href="ad.url" rel="noopener nofollow" target="_blank">
          <img :src="ad.image" :alt="ad.title" class="img-responsive" />
        </a>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.sidebarad-section {
  .ad-mark {
    right: 0.4rem;
    color: var(--c-text-lighter);
    font-size: 0.7rem;
    position: absolute;
    background-color: var(--c-bg-darker);
  }
}
</style>