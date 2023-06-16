<template>
  <div :class="['initial-container', classValue]">
    <div class="loader">
      <i class="fa fa-circle-notch fa-spin"></i>
      {{ $t("loading-spin-text") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const classValue = ref('');

onMounted(() => {
  classValue.value = 'hide';
});
</script>

<style lang="scss" scoped>
@use "../styles/palette.scss" as *;

.initial-container {
  font-size: $font-size-sm;

  .loader {
    z-index: $zindex-1;
    position: fixed;
    top: $navbar-height + 0.6rem;
    right: 0;
    display: inline-block;
    padding: 0 1rem;
    border: 3px solid lighten($warning-color, 7%);
    border-right: 0px;
    background: lighten($warning-color, 25%);
    color: lighten($text-color, 20%);
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;

    @media (max-width: $MQMobileNarrow) {
      top: 0.46rem;
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
loading-spin-text: Loading...
</i18n>

<i18n locale="zh-CN" lang="yaml">
loading-spin-text: 加载中...
</i18n>