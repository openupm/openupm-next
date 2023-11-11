<script setup lang="ts">
import { PropType, computed } from "vue";

import { generateHueFromStringInRange, timeAgoFormat } from '@/utils';
import { PackageMetadata } from '@openupm/types';
import { getAvatarImageUrl, getGitHubAvatarUrl, getPackageDetailPagePath } from '@openupm/common/build/urls.js';
import { getLocalePackageDescription, getLocalePackageDisplayName } from "@openupm/common/build/utils.js";

const props = defineProps({
  metadata: {
    type: Object as PropType<PackageMetadata>,
    required: true
  },
  preferRawAvatarUrl: {
    type: Boolean,
    default: false
  }
});

const ownerAvatarUrl = computed(() => {
  const avatarSize = 48;
  if (props.preferRawAvatarUrl)
    return getGitHubAvatarUrl(props.metadata.owner, avatarSize);
  return getAvatarImageUrl(props.metadata.owner, avatarSize);
});

const parentOwnerAvatarUrl = computed(() => {
  if (!props.metadata.parentOwner) return null;
  const avatarSize = 48;
  if (props.preferRawAvatarUrl)
    return getGitHubAvatarUrl(props.metadata.parentOwner, avatarSize);
  return getAvatarImageUrl(props.metadata.parentOwner, avatarSize);
});

const timeAgoText = computed(() => {
  return timeAgoFormat(new Date(props.metadata.time));
});

const defaultImageInlineStyle = computed(() => {
  return `background: linear-gradient(37deg, ${stopColor1.value}, ${stopColor2.value});`
});

const stopColor1 = computed(() => {
  const hue = generateHueFromStringInRange(props.metadata.name, 0, 180);
  const saturation = generateHueFromStringInRange(props.metadata.name, 70, 95);
  const color = `hsl(${hue}, ${saturation}%, 37%)`;
  return color;
});

const stopColor2 = computed(() => {
  let hue = generateHueFromStringInRange(props.metadata.name, 150, 255);
  hue = (hue + 25) % 255;
  const Saturation = generateHueFromStringInRange(props.metadata.name, 30, 70);
  const color = `hsl(${hue}, ${Saturation}%, 17%)`;
  return color;
});

const packageDisplayName = computed(() => {
  return getLocalePackageDisplayName(props.metadata);
});

const packageDescription = computed(() => {
  return getLocalePackageDescription(props.metadata);
});

const packageLink = computed(() => {
  return {
    text: packageDisplayName.value,
    link: getPackageDetailPagePath(props.metadata.name)
  };
});

const imageErrorMessage = computed(() => {
  return `Failed to load image for ${props.metadata.name}: `;
});
</script>

<template>
  <div class="package-card">
    <div class="card-inner">
      <div class="card-content">
        <div class="card-image-wrapper">
          <div class="card-image">
            <LazyImage v-if="metadata.image" :src="metadata.image" class="img-responsive"
              :error-message="imageErrorMessage" />
            <div v-else class="default-image" :style="defaultImageInlineStyle">
              <span>{{ packageDisplayName }}</span>
            </div>
          </div>
        </div>
        <div class="card-header">
          <div class="h5">
            <AutoLink :item="packageLink" />
          </div>
        </div>
        <div class="card-body">
          {{ packageDescription }}
        </div>
        <div class="card-footer">
          <div class="row1">
            <span v-if="metadata.owner" class="chip chip-avatar">
              <LazyImage :src="ownerAvatarUrl" :alt="metadata.owner" class="avatar avatar-sm" />
              {{ metadata.owner }}
            </span>
            <span v-if="metadata.time" class="chip">
              <i class="fas fa-clock"></i>{{ timeAgoText }}
            </span>
          </div>
          <div class="row2">
            <span v-if="metadata.stars" class="chip">
              <i class="fa fa-star"></i>{{ metadata.stars }}
            </span>
            <span v-if="metadata.dl30d" class="chip">
              <i class="fas fa-download"></i>
              {{ metadata.dl30d }}/month
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/styles/palette' as *;

.package-card {
  --card-content-padding-lr: 0.4rem;
  font-size: $font-size-md;

  .card-inner {
    box-shadow: 0 .25rem .5rem var(--c-border);

    .card-header {
      padding: 0.3rem var(--card-content-padding-lr) 0;

      .h5 {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: $font-size-md;

        >a {
          font-weight: 600;
        }
      }
    }

    .card-body {
      padding: 0 var(--card-content-padding-lr) 0.5rem;
      padding-top: 0rem;
      height: 1.8rem;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: -o-ellipsis-lastline;
      font-size: $font-size-sm;
    }

    .card-image-wrapper {
      width: 100%;
      height: 0;
      overflow: hidden;
      padding-top: calc(1 / 2 * 100%);
      position: relative;

      .card-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
        }

        .default-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;

          span {
            font-size: 0.9rem;
            font-weight: bold;
            color: white;
            text-align: center;
            padding: 0 0.5rem;
          }
        }
      }
    }

    .card-footer {
      height: 3.2rem;
      padding: 0 var(--card-content-padding-lr);
      box-sizing: border-box;

      .chip {
        margin-bottom: 0.2rem;
        font-size: $font-size-xs;

        &.chip-avatar {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 16ch;
        }
      }
    }
  }
}

.dark {
  .package-card {
    .card-inner {
      box-shadow: none;
      background-color: var(--c-bg-light);
    }
  }
}
</style>