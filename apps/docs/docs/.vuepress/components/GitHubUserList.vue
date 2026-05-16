<script setup lang="ts">
import { computed } from 'vue';

interface GitHubUser {
  text: string;
  slug: string;
  githubUser: string;
  abbr?: string;
  expires?: string;
}

const props = defineProps({
  items: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array<any>,
    default: () => []
  }
});

const users = computed(() => {
  return props.items
    .filter((x: GitHubUser) => {
      if (x.expires) {
        return Date.parse(x.expires) >= new Date().getTime();
      }
      return true;
    })
});
</script>

<template>
  <div class="github-user-container">
    <div v-for="(profile, index) in users" :key="index" class="github-user-item">
      <GitHubAvatar :profile="profile" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.github-user-container {
  margin: 0 0 1.2rem 0;
}

.github-user-item {
  display: inline-block;
  vertical-align: middle;
  margin: 0 0.8rem 0.8rem 0;
  max-width: 10rem;
}
</style>
