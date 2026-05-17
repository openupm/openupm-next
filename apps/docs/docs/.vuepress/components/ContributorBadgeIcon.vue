<script setup lang="ts">
defineProps<{
  icon: string;
  label?: string;
}>();
</script>

<template>
  <svg
    class="profile-badge-icon"
    viewBox="0 0 70 70"
    width="70"
    height="70"
    role="img"
    aria-hidden="true"
    focusable="false"
  >
    <circle class="badge-disc" cx="35" cy="35" r="31" />
    <circle class="badge-ring" cx="35" cy="35" r="26" />
    <path class="badge-shine" d="M19 24c4-8 12-13 22-13 5 0 10 1 14 4" />
    <g v-if="icon === 'year-search'" class="badge-year-mark">
      <circle cx="45" cy="20" r="5" />
      <path d="m49 24 5 5" />
      <path d="M45 17v6" />
      <path d="M42 20h6" />
    </g>
    <g v-else-if="icon === 'year-box'" class="badge-year-mark">
      <path d="M40 20 48 15l8 5-8 5-8-5Z" />
      <path d="M40 20v9l8 5 8-5v-9" />
      <path d="M48 25v9" />
    </g>
    <g v-else-if="icon === 'search'" class="badge-mark">
      <circle cx="31" cy="30" r="9" />
      <path d="m38 37 10 10" />
      <path d="M31 26v8" />
      <path d="M27 30h8" />
    </g>
    <g v-else-if="icon === 'box'" class="badge-mark">
      <path d="M22 28 35 20l13 8-13 8-13-8Z" />
      <path d="M22 28v15l13 8 13-8V28" />
      <path d="M35 36v15" />
    </g>
    <g v-else-if="icon === 'trophy'" class="badge-mark">
      <path d="M27 22h16v8c0 8-4 14-8 14s-8-6-8-14v-8Z" />
      <path d="M27 27h-7c0 8 3 12 9 13" />
      <path d="M43 27h7c0 8-3 12-9 13" />
      <path d="M35 44v7" />
      <path d="M27 52h16" />
    </g>
    <g v-else-if="icon === 'spark'" class="badge-mark">
      <path d="M35 50V31" />
      <path d="M35 35c-8-1-13-6-14-14 8 1 13 6 14 14Z" />
      <path d="M36 39c8-1 13-6 14-14-8 1-13 6-14 14Z" />
      <path d="M24 52h22" />
    </g>
    <g v-else-if="icon === 'coin'" class="badge-mark">
      <circle cx="35" cy="35" r="15" />
      <path d="M35 25v20" />
      <path d="M41 30c-2-3-11-3-12 1-1 6 12 4 12 9 0 5-10 5-13 1" />
    </g>
    <g v-else class="badge-mark">
      <path d="M35 18 40 30l13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1 5-12Z" />
    </g>
    <text
      v-if="icon.startsWith('year-') && label"
      class="badge-year-metric"
      x="35"
      y="43"
      text-anchor="middle"
    >
      {{ label }}
    </text>
    <text
      v-else-if="icon === 'trophy' && label"
      class="badge-trophy-metric"
      x="35"
      y="35"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ label }}
    </text>
    <text
      v-else-if="label"
      class="badge-metric"
      x="35"
      y="62"
      text-anchor="middle"
    >
      {{ label }}
    </text>
  </svg>
</template>

<style lang="scss" scoped>
.profile-badge-icon {
  display: block;
  width: 70px;
  height: 70px;
  overflow: visible;
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 12%));
}

.badge-disc {
  fill: var(--c-bg);
  stroke: currentColor;
  stroke-width: 3;
}

.badge-ring {
  fill: color-mix(in srgb, currentColor 13%, transparent);
  stroke: color-mix(in srgb, currentColor 42%, var(--c-bg));
  stroke-width: 1.5;
  stroke-dasharray: 3 4;
}

.badge-shine {
  fill: none;
  stroke: color-mix(in srgb, currentColor 45%, var(--c-bg));
  stroke-linecap: round;
  stroke-width: 2;
}

.badge-mark {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.2;
}

.badge-mark circle {
  fill: none;
}

.badge-year-mark {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.6;
}

.badge-metric {
  fill: currentColor;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0;
}

.badge-trophy-metric {
  fill: currentColor;
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0;
  paint-order: stroke;
  stroke: var(--c-bg);
  stroke-linejoin: round;
  stroke-width: 2.4px;
}

.badge-year-metric {
  fill: currentColor;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0;
  paint-order: stroke;
  stroke: var(--c-bg);
  stroke-linejoin: round;
  stroke-width: 2.8px;
}
</style>
