<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  id: {
    type: String,
    default: ""
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showBody: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <div :id="id" class="modal">
    <a href="#close" class="modal-overlay" aria-label="Close"></a>
    <div class="modal-container">
      <div v-if="showHeader" class="modal-header">
        <a href="#close" class="btn btn-clear float-right" aria-label="Close"></a>
        <div class="modal-title h5">
          <slot name="title"></slot>
        </div>
      </div>
      <div v-if="showBody" class="modal-body">
        <div class="content">
          <slot name="body"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-container {
  .modal-header {
    color: var(--c-text);
  }
}

.dark {
  .modal-container {
    background-color: var(--c-bg);
  }
}
</style>