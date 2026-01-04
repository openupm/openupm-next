<script setup lang="ts">
import copy from "copy-to-clipboard";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  copyText: {
    type: String,
    default: "",
  },
  displayBlock: {
    type: Boolean,
    default: false,
  },
});

const copiedTooltip = computed(() => {
  return t("copied-tooltip");
});

const copied = ref(false);

const copyIt = (): void => {
  copy(props.copyText, { format: "text/plain" });
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <span :data-tooltip="copiedTooltip"
    :class="{ 'copy-wrapper tooltip tooltip-click': true, 'tooltip-clicked': copied, 'd-block': displayBlock }"
    @click="copyIt">
    <slot></slot>
  </span>
</template>

<style lang="scss" scoped>
.copy-wrapper {
  display: inline-block;
  max-width: 100%;
  cursor: pointer;

  &.d-block {
    display: block;
  }
}

.tooltip {
  &.tooltip-click {

    // Reset style for spectre .tooltip:hover
    &::after {
      transform: translate(-50%, 0);
    }

    &:focus::after,
    &:hover::after {
      opacity: 0;
      transform: translate(-50%, 0);
    }
  }

  &.tooltip-clicked::after {
    opacity: 1;
    animation: tooltip-clicked-fade-out 1.2s ease-in-out forwards;
  }
}

@keyframes tooltip-clicked-fade-out {
  0% {
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>

<i18n locale="en-US" lang="yaml">
  copied-tooltip: Copied to pasteboard
</i18n>

