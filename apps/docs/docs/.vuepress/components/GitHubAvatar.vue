<script setup lang="ts">
import { PropType } from 'vue';

import { getAvatarImageUrl, getContributorProfilePagePath } from "@openupm/common/build/urls.js";

interface Profile {
  githubUser: string;
  text?: string;
  abbr?: string;
}

const props = defineProps({
  profile: {
    type: Object as PropType<Profile>,
    required: true
  },
  linkToProfile: {
    type: Boolean,
    default: false
  }
});

const { text, abbr, githubUser } = props.profile;
const profilePath = getContributorProfilePagePath(githubUser);
const githubUrl = `https://github.com/${githubUser}`;
const imageUrl = getAvatarImageUrl(githubUser, 128);
</script>

<template>
  <figure class="avatar avatar-xl tooltip" :data-tooltip="text" :data-initial="abbr">
    <RouterLink v-if="linkToProfile" :to="profilePath">
      <LazyImage v-if="imageUrl" :src="imageUrl" :alt="text" />
    </RouterLink>
    <a v-else :href="githubUrl">
      <LazyImage v-if="imageUrl" :src="imageUrl" :alt="text" />
    </a>
  </figure>
</template>
