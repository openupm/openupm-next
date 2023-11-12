<!-- eslint-disable vue/multi-word-component-names -->
<!-- Modified from https://gist.github.com/Frenchcooc/e4748ad6275984a01868153e3c0d8a1e -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  dataPoints: {
    type: Array<number>,
    required: true,
  },
});
const stroke = 2;
const width = 160;
const height = 60;
const defaultBaseFillHeight = 20;

const shape = computed(() => {
  const data = props.dataPoints;
  const highestPoint = Math.max(...data) + 1;
  const lowestPoint = Math.min(...data);
  const baseFillHeight = lowestPoint === 0 ? 2 : defaultBaseFillHeight;
  const coordinates = [] as { x: number; y: number }[];
  const totalPoints = data.length - 1;

  data.forEach((item, n) => {
    const x = (n / totalPoints) * width + stroke;
    const y =
      height -
      (item / highestPoint) * (height - baseFillHeight) +
      stroke -
      baseFillHeight;
    coordinates.push({ x, y });
  });

  if (!coordinates[0]) {
    return `M 0 ${stroke} L 0 ${stroke} L ${width} ${stroke}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = [] as any[];

  coordinates.forEach((point) =>
    path.push(['L', point.x, point.y].join(' '))
  );

  return ['M' + coordinates[0].x, coordinates[0].y, ...path].join(' ');
});

const fillEndPath = computed(() => {
  return `V ${height} L 4 ${height} Z`;
});
</script>

<template>
  <svg class="sparkline" :width="width" :height="height" :stroke-width="stroke">
    <path class="sparkline--line" :d="shape" fill="none"></path>
    <path class="sparkline--fill" :d="[shape, fillEndPath].join(' ')" stroke="none"></path>
  </svg>
</template>

<style lang="scss" scoped>
svg {
  stroke: #1f8ceb;
  fill: rgba(31, 140, 235, 0.06);
  transition: all 1s ease-in-out;
}

svg path {
  box-sizing: border-box;
}
</style>
