<template>
  <div :class="['initial-container', classValue]">
    <div class="loader">
      <i class="fa fa-circle-notch fa-spin mr-1"></i>
      <strong>{{ $t("loading-spin-text") }}</strong>
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
    padding: 0 1rem;
    border: solid var(--c-warning);
    border-width: 0 0 0 0.3rem;
    background: var(--c-warning-bg);
    color: var(--c-warning-title);

    @media (max-width: $MQMobileNarrow) {
      top: 0.46rem;
    }
  }
}
</style>

<i18n locale="en-US" lang="yaml">
loading-spin-text: Loading...
</i18n>

