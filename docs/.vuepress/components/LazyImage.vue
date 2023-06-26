<script setup lang="ts">
import VLazyImage from "v-lazy-image";

const DefaultImagePlaceholder =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=";

const props = defineProps({
  placeholder: {
    type: String,
    default: DefaultImagePlaceholder
  }
});

const imageNotFound = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = DefaultImagePlaceholder;
  target.classList.add("v-lazy-image-loaded");
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