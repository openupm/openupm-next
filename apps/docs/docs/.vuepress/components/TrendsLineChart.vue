<template>
  <VChart
    v-if="mounted"
    class="trends-echart"
    :option="chartOption"
    autoresize
    @click="handleChartClick"
    @mouseover="handleChartHover"
    @mouseout="clearChartHover"
  />
  <div v-else class="trends-echart"></div>
  <div v-if="series.length > 1" class="trends-chart__legend">
    <span
      v-for="(entry, index) in series"
      :key="entry.key"
      role="button"
      tabindex="0"
      :class="{
        'is-active': entry.label === hoveredSeriesName,
        'is-isolated': entry.key === isolatedSeriesKey,
      }"
      :style="{ '--series-color': seriesColor(index) }"
      @click="toggleIsolatedSeries(entry.key)"
      @keydown.enter.prevent="toggleIsolatedSeries(entry.key)"
      @keydown.space.prevent="toggleIsolatedSeries(entry.key)"
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
import { computed, onMounted, ref, watch } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { useDarkMode } from "@vuepress/theme-default/client";
import VChart from "vue-echarts";
import { TrendsSeries } from "@openupm/types";

import {
  formatNumber,
  formatYearTick,
  pickDarkSeriesColor,
  pickSeriesColor,
  shouldShowYearTick,
} from "../trendsView";

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent]);

const props = defineProps<{
  series: TrendsSeries[];
}>();

const selectedDate = ref("");
const hoveredSeriesName = ref("");
const isolatedSeriesKey = ref("");
const mounted = ref(false);
const isDarkMode = useDarkMode();

onMounted(() => {
  mounted.value = true;
});

watch(
  () => props.series,
  (series) => {
    if (
      isolatedSeriesKey.value &&
      !series.some((entry) => entry.key === isolatedSeriesKey.value)
    ) {
      isolatedSeriesKey.value = "";
    }
  },
);

const visibleSeries = computed(() =>
  isolatedSeriesKey.value
    ? props.series.filter((entry) => entry.key === isolatedSeriesKey.value)
    : props.series,
);

function seriesColor(index: number): string {
  return isDarkMode.value ? pickDarkSeriesColor(index) : pickSeriesColor(index);
}

const allDates = computed(() =>
  Array.from(
    new Set(
      visibleSeries.value.flatMap((entry) =>
        entry.points.map((point) => point.date),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b)),
);

const chartOption = computed(() => ({
  animation: false,
  textStyle: {
    color: isDarkMode.value ? "#cbd5e1" : "#475569",
  },
  color: visibleSeries.value.map((entry) =>
    seriesColor(props.series.findIndex((series) => series.key === entry.key)),
  ),
  grid: {
    left: 44,
    right: 18,
    top: 14,
    bottom: 28,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "line" },
    backgroundColor: isDarkMode.value ? "#111827" : "#ffffff",
    borderColor: isDarkMode.value ? "rgba(148, 163, 184, 0.32)" : "#d8dee8",
    textStyle: {
      color: isDarkMode.value ? "#e5e7eb" : "#1f2937",
    },
    valueFormatter: (value: number): string => formatNumber(value),
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: allDates.value,
    axisLabel: {
      color: isDarkMode.value ? "#f8fafc" : "#475569",
      interval: (index: number): boolean =>
        shouldShowYearTick(allDates.value, index),
      formatter: (value: string, index: number): string =>
        formatYearTick(value, index, allDates.value),
    },
    axisLine: {
      lineStyle: {
        color: isDarkMode.value
          ? "rgba(148, 163, 184, 0.36)"
          : "rgba(100, 116, 139, 0.32)",
      },
    },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    minInterval: 1,
    axisLabel: {
      color: isDarkMode.value ? "#f8fafc" : "#475569",
      formatter: (value: number): string => formatNumber(value),
    },
    axisLine: {
      lineStyle: {
        color: isDarkMode.value
          ? "rgba(148, 163, 184, 0.36)"
          : "rgba(100, 116, 139, 0.32)",
      },
    },
    splitLine: {
      lineStyle: {
        color: isDarkMode.value
          ? "rgba(148, 163, 184, 0.2)"
          : "rgba(148, 163, 184, 0.18)",
      },
    },
  },
  series: visibleSeries.value.map((entry) => {
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

const selectedSnapshot = computed(() =>
  selectedDate.value
    ? {
        date: selectedDate.value,
        values: visibleSeries.value.map((entry) => ({
          key: entry.key,
          label: entry.label,
          value:
            entry.points.find((point) => point.date === selectedDate.value)
              ?.value || 0,
          color: seriesColor(
            props.series.findIndex((series) => series.key === entry.key),
          ),
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

function toggleIsolatedSeries(key: string): void {
  isolatedSeriesKey.value = isolatedSeriesKey.value === key ? "" : key;
}
</script>
