<script setup lang="ts">
import VLazyImage from "v-lazy-image";

const DefaultImagePlaceholder =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const props = defineProps({
  placeholder: {
    type: String,
    default: DefaultImagePlaceholder
  }
});

const imageNotFound = (el: HTMLImageElement) => {
  el.src = DefaultImagePlaceholder;
  el.classList.add("v-lazy-image-loaded");
};
</script>

<template>
  <VLazyImage v-bind="$attrs" :src-placeholder="placeholder" @error.native="imageNotFound" />
</template>

<style lang="scss" scoped>
.v-lazy-image {
  filter: blur(5px);
  transition: filter 0.5s;
  will-change: filter;

  &-loaded {
    filter: blur(0);
  }
}
</style>