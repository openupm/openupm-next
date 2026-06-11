<template>
  <TrendsPage v-if="mounted" />
  <main v-else class="trends-page">
    <header class="trends-page__header">
      <div>
        <div class="trends-page__title-row">
          <h1>Trends</h1>
        </div>
        <p>Loading trends...</p>
      </div>
    </header>
    <div class="trends-page__notice">Loading...</div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import TrendsPage from "./TrendsPage.vue";

const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
});
</script>
