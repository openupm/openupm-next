<script setup lang="ts">
import LazyImage from '@/components/LazyImage.vue';
import { getAvatarImageUrl } from "@shared/urls";

interface Profile {
  githubUser: string;
  text?: string;
  abbr?: string;
}

const props = defineProps({
  profile: {
    type: Object as () => Profile,
    required: true
  }
});

const { text, abbr, githubUser } = props.profile;
const url = `https://github.com/${githubUser}`;
const imageUrl = getAvatarImageUrl(githubUser, 128);
</script>

<template>
  <figure class="avatar avatar-xl tooltip" :data-tooltip="text" :data-initial="abbr">
    <a :href="url">
      <LazyImage v-if="imageUrl" :src="imageUrl" :alt="text" />
    </a>
  </figure>
</template>
