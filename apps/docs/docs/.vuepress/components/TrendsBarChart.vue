<template>
  <VChart
    v-if="mounted"
    class="trends-echart"
    :option="chartOption"
    autoresize
    @click="handleChartClick"
  />
  <div v-else class="trends-echart"></div>
  <div v-if="selectedSnapshot" class="trends-chart__snapshot">
    <strong>{{ selectedSnapshot.date }}</strong>
    <span :style="{ '--series-color': seriesColor(0) }">
      {{ formatNumber(selectedSnapshot.value) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { useDarkMode } from "@vuepress/theme-default/client";
import VChart from "vue-echarts";
import { TrendsPoint } from "@openupm/types";

import {
  formatNumber,
  formatYearTick,
  isCurrentMonthDate,
  pickDarkSeriesColor,
  pickSeriesColor,
  shouldShowYearTick,
} from "../trendsView";

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent]);

const props = defineProps<{
  points: TrendsPoint[];
  seriesLabel?: string;
}>();

const selectedDate = ref("");
const mounted = ref(false);
const isDarkMode = useDarkMode();

onMounted(() => {
  mounted.value = true;
});

const dates = computed(() => props.points.map((point) => point.date));

function seriesColor(index: number): string {
  return isDarkMode.value ? pickDarkSeriesColor(index) : pickSeriesColor(index);
}

const incompleteBarColor = computed(() =>
  isDarkMode.value ? "rgba(248, 250, 252, 0.62)" : "rgba(15, 23, 42, 0.42)",
);

const chartOption = computed(() => ({
  animation: false,
  textStyle: {
    color: isDarkMode.value ? "#cbd5e1" : "#475569",
  },
  color: [seriesColor(0)],
  grid: {
    left: 44,
    right: 18,
    top: 14,
    bottom: 28,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    backgroundColor: isDarkMode.value ? "#111827" : "#ffffff",
    borderColor: isDarkMode.value ? "rgba(148, 163, 184, 0.32)" : "#d8dee8",
    textStyle: {
      color: isDarkMode.value ? "#e5e7eb" : "#1f2937",
    },
    valueFormatter: (value: number): string => formatNumber(value),
  },
  xAxis: {
    type: "category",
    data: dates.value,
    axisLabel: {
      color: isDarkMode.value ? "#f8fafc" : "#475569",
      interval: (index: number): boolean =>
        shouldShowYearTick(dates.value, index),
      formatter: (value: string, index: number): string =>
        formatYearTick(value, index, dates.value),
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
  series: [
    {
      name: props.seriesLabel || "Value",
      type: "bar",
      data: props.points.map((point) =>
        isCurrentMonthDate(point.date)
          ? {
              value: point.value,
              itemStyle: {
                borderColor: incompleteBarColor.value,
                borderType: "dashed",
                borderWidth: 2,
                decal: {
                  symbol: "line",
                  color: incompleteBarColor.value,
                  dashArrayX: [1, 0],
                  dashArrayY: [2, 4],
                  rotation: -Math.PI / 4,
                  symbolSize: 1,
                },
              },
            }
          : point.value,
      ),
      barMaxWidth: 18,
    },
  ],
}));

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
