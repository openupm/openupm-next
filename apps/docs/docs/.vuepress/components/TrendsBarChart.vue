<template>
  <ClientOnly>
    <VChart
      class="trends-echart"
      :option="chartOption"
      autoresize
      @click="handleChartClick"
    />
  </ClientOnly>
  <div v-if="selectedSnapshot" class="trends-chart__snapshot">
    <strong>{{ selectedSnapshot.date }}</strong>
    <span :style="{ '--series-color': pickSeriesColor(0) }">
      {{ formatNumber(selectedSnapshot.value) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import VChart from "vue-echarts";
import { TrendsPoint } from "@openupm/types";

import { formatNumber, pickSeriesColor } from "../trendsView";

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent]);

const props = defineProps<{
  points: TrendsPoint[];
}>();

const selectedDate = ref("");

const dates = computed(() => props.points.map((point) => point.date));

const chartOption = computed(() => ({
  animation: false,
  color: [pickSeriesColor(0)],
  grid: {
    left: 44,
    right: 18,
    top: 14,
    bottom: 28,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    valueFormatter: (value: number): string => formatNumber(value),
  },
  xAxis: {
    type: "category",
    data: dates.value,
    axisLabel: {
      color: "inherit",
      hideOverlap: true,
      formatter: formatYearTick,
    },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    minInterval: 1,
    axisLabel: {
      color: "inherit",
      formatter: (value: number): string => formatNumber(value),
    },
    splitLine: {
      lineStyle: { color: "rgba(148, 163, 184, 0.18)" },
    },
  },
  series: [
    {
      name: "Value",
      type: "bar",
      data: props.points.map((point) => point.value),
      barMaxWidth: 18,
    },
  ],
}));

function formatYearTick(value: string, index: number): string {
  const year = value.substring(0, 4);
  const previousDate = dates.value[index - 1];
  return previousDate?.substring(0, 4) === year ? "" : year;
}

const selectedSnapshot = computed(() => {
  if (!selectedDate.value) return null;
  return {
    date: selectedDate.value,
    value:
      props.points.find((point) => point.date === selectedDate.value)?.value ||
      0,
  };
});

function handleChartClick(params: { name?: string }): void {
  if (typeof params.name === "string") selectedDate.value = params.name;
}
</script>
