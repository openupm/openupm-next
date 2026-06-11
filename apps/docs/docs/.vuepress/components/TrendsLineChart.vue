<template>
  <ClientOnly>
    <VChart
      class="trends-echart"
      :option="chartOption"
      autoresize
      @click="handleChartClick"
      @mouseover="handleChartHover"
      @mouseout="clearChartHover"
    />
  </ClientOnly>
  <div v-if="series.length > 1" class="trends-chart__legend">
    <span
      v-for="(entry, index) in series"
      :key="entry.key"
      :class="{ 'is-active': entry.label === hoveredSeriesName }"
      :style="{ '--series-color': pickSeriesColor(index) }"
    >
      {{ entry.label }}
    </span>
  </div>
  <div v-if="selectedSnapshot" class="trends-chart__snapshot">
    <strong>{{ selectedSnapshot.date }}</strong>
    <span
      v-for="entry in selectedSnapshot.values"
      :key="entry.key"
      :style="{ '--series-color': entry.color }"
    >
      {{ entry.label }} {{ formatNumber(entry.value) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import VChart from "vue-echarts";
import { TrendsSeries } from "@openupm/types";

import { formatNumber, pickSeriesColor } from "../trendsView";

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent]);

const props = defineProps<{
  series: TrendsSeries[];
}>();

const selectedDate = ref("");
const hoveredSeriesName = ref("");

const allDates = computed(() =>
  Array.from(
    new Set(
      props.series.flatMap((entry) => entry.points.map((point) => point.date)),
    ),
  ).sort((a, b) => a.localeCompare(b)),
);

const chartOption = computed(() => ({
  animation: false,
  color: props.series.map((_, index) => pickSeriesColor(index)),
  grid: {
    left: 44,
    right: 18,
    top: 14,
    bottom: 28,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "line" },
    valueFormatter: (value: number): string => formatNumber(value),
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: allDates.value,
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
  series: props.series.map((entry) => {
    const values = new Map(
      entry.points.map((point) => [point.date, point.value]),
    );
    return {
      name: entry.label,
      type: "line",
      symbol: "circle",
      symbolSize: 5,
      showSymbol: true,
      data: allDates.value.map((date) => values.get(date) ?? null),
      connectNulls: false,
      emphasis: { focus: "series" },
    };
  }),
}));

function formatYearTick(value: string, index: number): string {
  const year = value.substring(0, 4);
  const previousDate = allDates.value[index - 1];
  return previousDate?.substring(0, 4) === year ? "" : year;
}

const selectedSnapshot = computed(() =>
  selectedDate.value
    ? {
        date: selectedDate.value,
        values: props.series.map((entry, index) => ({
          key: entry.key,
          label: entry.label,
          value:
            entry.points.find((point) => point.date === selectedDate.value)
              ?.value || 0,
          color: pickSeriesColor(index),
        })),
      }
    : null,
);

function handleChartClick(params: { name?: string }): void {
  if (typeof params.name === "string") selectedDate.value = params.name;
}

function handleChartHover(params: { seriesName?: string }): void {
  hoveredSeriesName.value =
    typeof params.seriesName === "string" ? params.seriesName : "";
}

function clearChartHover(): void {
  hoveredSeriesName.value = "";
}
</script>
