<script setup lang="ts">
import { computed } from 'vue';

const articleLink = computed(() => {
  return {
    link: "/docs/host-private-upm-registry-15-minutes", text: "Host Your First Private UPM Registry",
    icon: "fas fa-server",
    iconLeft: false
  }
});
</script>
<template>
  <section class="ml-2 mr-2 mt-2">
    <div class="columns">
      <div class="column col-12">
        <AutoLink class :item="articleLink" />
      </div>
    </div>
  </section>
</template>
<style lang="scss" scoped></style>