<script setup lang="ts">
import VLazyImage from "v-lazy-image";

const DefaultImagePlaceholder =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const props = defineProps({
  placeholder: {
    type: String,
    // eslint-disable-next-line vue/valid-define-props
    default: DefaultImagePlaceholder
  },
  errorMessage: {
    type: String,
    default: "Image not found: "
  }
});

const imageNotFound = (el: HTMLImageElement): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = (el.attributes as any).src.value;
  console.log(props.errorMessage + src);
  el.src = DefaultImagePlaceholder;
  el.classList.add("v-lazy-image-loaded");
};
</script>

<template>
  <VLazyImage v-bind="$attrs" :src-placeholder="placeholder" @error="imageNotFound" />
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