<script setup lang="ts">
import { computed } from 'vue';
import numeral from 'numeral';

import { useDefaultStore } from '@/store';

const store = useDefaultStore();
</script>

<template>
  <div class="navbar-items hide-md">
    <div class="nav-item growth">
      <div class="btn-group">
        <a href="https://github.com/openupm/openupm" rel="noopener noreferrer" class="btn btn-default btn-sm">
          <i class="fab fa-github"></i> Stars <span class="stars">{{ store.formattedStars }}</span>
        </a>
        <a href="https://www.patreon.com/openupm" rel="noopener noreferrer" class="btn btn-default btn-sm">
          <i class="fab fa-patreon"></i> {{ $capitalize($t("donate")) }}
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

.navbar-items {
  .nav-item {
    .btn-group {
      flex-wrap: nowrap;
    }

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