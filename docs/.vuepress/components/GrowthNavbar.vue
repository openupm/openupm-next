<script setup lang="ts">
import { computed } from 'vue';
import numeral from 'numeral';

import { useDefaultStore } from '@/store';

const store = useDefaultStore();

const stars = computed(() => {
  const value = Number(store.siteInfo.stars);
  if (isNaN(value)) return "...";
  return numeral(value).format("1.1a");
});

</script>

<template>
  <div class="navbar-items hide-md">
    <div class="nav-item growth">
      <div class="btn-group">
        <a href="https://github.com/openupm/openupm" class="btn btn-default btn-sm"><i class="fab fa-github"></i> Stars
          <span class="stars">{{ stars }}</span></a>
        <a href="https://www.patreon.com/openupm" class="btn btn-default btn-sm"><i class="fab fa-patreon"></i> {{
          $t("donate") }}</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/styles/palette' as *;

.navbar-items {
  .nav-item {
    &.growth {
      margin-left: 1rem;
      display: inline-block;

      .btn {
        font-size: 12px;
        font-weight: bold;
        padding-top: 0;
        padding-bottom: 0;
        height: 1.45rem;

        .stars {
          display: inline-block;
          min-width: 1rem;
        }
      }
    }
  }
}
</style>
