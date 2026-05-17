<script setup lang="ts">
import { computed, PropType } from 'vue';

import { getAvatarImageUrl, getContributorProfilePagePath } from "@openupm/common/build/urls.js";

interface Profile {
  githubUser: string;
  text?: string;
  abbr?: string;
  url?: string;
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
const linkUrl = computed(() => {
  return props.profile.url || (props.linkToProfile ? profilePath : githubUrl);
});
const isInternalLink = computed(() => linkUrl.value.startsWith('/'));
</script>

<template>
  <figure class="avatar avatar-xl tooltip" :data-tooltip="text" :data-initial="abbr">
    <RouterLink v-if="isInternalLink" :to="linkUrl">
      <LazyImage v-if="imageUrl" :src="imageUrl" :alt="text" />
    </RouterLink>
    <a v-else :href="linkUrl" rel="noopener noreferrer">
      <LazyImage v-if="imageUrl" :src="imageUrl" :alt="text" />
    </a>
  </figure>
</template>
