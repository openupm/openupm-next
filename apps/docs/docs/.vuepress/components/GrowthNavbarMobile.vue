

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n'
import numeral from 'numeral';

import { capitalize } from "lodash-es";
import { useDefaultStore } from '@/store';
const store = useDefaultStore();
const { t } = useI18n();

const packagesLink = computed(() => {
  return {
    link: "/packages/",
    text: capitalize(t("packages")),
    icon: "fa fa-box-open",
    iconLeft: true
  }
});
</script>

<template>
  <div class="growth-navbar-mobile show-sm">
    <div class="columns">
      <div class="column col-12">
        <div class="btn-group">
          <AutoLink :item="packagesLink" class="btn btn-default btn-sm" />
          <a href="https://github.com/openupm/openupm" rel="noopener noreferrer" class="btn btn-default btn-sm">
            <i class="fab fa-github"></i> Stars
            <span class="stars">{{ store.formattedStars }}</span>
          </a>
          <a href="https://www.patreon.com/openupm" rel="noopener noreferrer" class="btn btn-default btn-sm">
            <i class="fab fa-patreon"></i> {{ $capitalize($t("donate")) }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/palette' as *;

// ad-block
.growth-navbar-mobile {
  position: fixed;
  width: 100%;
  top: $navbar-height;
  margin: 0;
  z-index: 1;

  .btn-group {
    width: 100%;

    .btn {
      font-weight: bold;

      &:first-child {
        border-radius: 0;
        border-left: 0;
      }

      &:last-child {
        border-radius: 0;
        border-right: 0;
      }
    }
  }

  .stars {
    display: inline-block;
    min-width: 1rem;
  }
}
</style>
