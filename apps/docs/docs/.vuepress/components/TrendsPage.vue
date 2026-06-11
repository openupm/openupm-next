<template>
  <main class="trends-page">
    <header class="trends-page__header">
      <div>
        <div class="trends-page__title-row">
          <h1>Trends</h1>
          <span v-if="trends" class="trends-page__updated">
            Updated {{ updatedText }}
          </span>
        </div>
        <p v-if="trends">
          OpenUPM package growth, release activity, signing adoption, and
          download momentum.
        </p>
        <p v-else-if="loading">Loading trends...</p>
        <p v-else-if="error">{{ error }}</p>
      </div>
    </header>

    <div v-if="loading" class="trends-page__notice">Loading...</div>
    <div v-else-if="error" class="trends-page__notice is-error">
      {{ error }}
    </div>

    <template v-if="trends">
      <section class="trends-page__section">
        <div class="trends-page__section-title">
          <h2>Catalog Growth</h2>
        </div>
        <div class="trends-page__metrics">
          <div>
            <span>Total Packages</span>
            <strong>{{
              formatNumber(
                latestValue(trends.catalogGrowth.totalPackageSubmissionsByDay),
              )
            }}</strong>
          </div>
          <div>
            <span>Latest Month</span>
            <strong>{{ latestPackageMonth }}</strong>
          </div>
        </div>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Total packages</h3>
            <strong>{{
              formatNumber(
                latestValue(trends.catalogGrowth.totalPackageSubmissionsByDay),
              )
            }}</strong>
          </div>
          <TrendsLineChart
            :series="[
              {
                key: 'packages',
                label: 'Packages',
                points: trends.catalogGrowth.totalPackageSubmissionsByDay,
              },
            ]"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <div>
              <h3>Total active packages</h3>
              <p>
                Packages with at least one successful published release in the
                last 12 months.
              </p>
            </div>
            <strong>{{
              formatNumber(
                latestValue(trends.catalogGrowth.totalActivePackagesByDay),
              )
            }}</strong>
          </div>
          <TrendsLineChart
            :series="[
              {
                key: 'activePackages',
                label: 'Active packages',
                points: trends.catalogGrowth.totalActivePackagesByDay,
              },
            ]"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>New packages per month</h3>
            <strong>{{ latestPackageMonth }}</strong>
          </div>
          <TrendsBarChart
            :points="trends.catalogGrowth.newPackageSubmissionsByMonth"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Packages by topic</h3>
            <input
              v-model="topicQuery"
              class="trends-chart__filter"
              type="search"
              placeholder="Filter topics"
            />
          </div>
          <TrendsLineChart :series="visibleTopicSeries" />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>New packages per month by topic</h3>
          </div>
          <TrendsLineChart :series="visibleMonthlyTopicSeries" />
        </article>
      </section>

      <section class="trends-page__section">
        <div class="trends-page__section-title">
          <h2>Signing And Publishing Mode</h2>
        </div>
        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Signed packages</h3>
            <strong>{{
              formatNumber(
                latestValue(trends.trustAndDistribution.signedPackagesByDay),
              )
            }}</strong>
          </div>
          <TrendsLineChart
            :series="[
              {
                key: 'signed',
                label: 'Signed packages',
                points: trends.trustAndDistribution.signedPackagesByDay,
              },
            ]"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Publishing modes</h3>
          </div>
          <TrendsLineChart
            :series="trends.trustAndDistribution.releaseSourceAndSigningByDay"
          />
        </article>
      </section>

      <section class="trends-page__section">
        <div class="trends-page__section-title">
          <h2>Release Activity</h2>
        </div>
        <div class="trends-page__metrics">
          <div>
            <span>Total Releases</span>
            <strong>{{ totalReleasesText }}</strong>
          </div>
          <div>
            <span>Last Month</span>
            <strong>{{ latestReleaseMonth }}</strong>
          </div>
        </div>
        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Total releases</h3>
            <strong>{{ totalReleasesText }}</strong>
          </div>
          <TrendsLineChart
            :series="[
              {
                key: 'totalReleases',
                label: 'Releases',
                points: trends.releaseActivity.totalReleasesByTime,
              },
            ]"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Releases per month</h3>
            <strong>{{ latestReleaseMonth }}</strong>
          </div>
          <TrendsBarChart :points="trends.releaseActivity.releasesPerMonth" />
        </article>
      </section>

      <section class="trends-page__section">
        <div class="trends-page__section-title">
          <h2>Downloads</h2>
        </div>
        <div class="trends-page__metrics">
          <div>
            <span>Total Downloads</span>
            <strong>{{ totalDownloadsText }}</strong>
          </div>
          <div>
            <span>Latest Month</span>
            <strong>{{ latestDownloadMonth }}</strong>
          </div>
        </div>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Total downloads</h3>
            <strong>{{ totalDownloadsText }}</strong>
          </div>
          <TrendsLineChart
            :series="[
              {
                key: 'totalDownloads',
                label: 'Total downloads',
                points: trends.downloads.totalDownloadsByTime,
              },
            ]"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Downloads per month</h3>
            <strong>{{ latestDownloadMonth }}</strong>
          </div>
          <TrendsBarChart
            :points="trends.downloads.downloadsPerMonth"
            series-label="Downloads per month"
          />
        </article>

        <article class="trends-chart">
          <div class="trends-chart__title">
            <h3>Downloads per month by topic</h3>
          </div>
          <TrendsLineChart :series="visibleMonthlyDownloadTopicSeries" />
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import axios from "axios";
import urlJoin from "url-join";
import { computed, onMounted, ref } from "vue";
import { getAPIBaseUrl } from "@openupm/common/build/urls.js";
import { PublicTrends } from "@openupm/types";
import {
  filterSeries,
  formatNumber,
  latestValue,
  previousMonth,
  valueAtDate,
} from "../trendsView";
import TrendsBarChart from "./TrendsBarChart.vue";
import TrendsLineChart from "./TrendsLineChart.vue";

const loading = ref(true);
const error = ref("");
const trends = ref<PublicTrends | null>(null);
const topicQuery = ref("");

const updatedText = computed(() => {
  if (!trends.value) return "";
  return new Date(trends.value.generatedAt).toLocaleString();
});

const visibleTopicSeries = computed(() =>
  trends.value
    ? filterSeries(
        trends.value.catalogGrowth.packageSubmissionsByTopicByDay,
        topicQuery.value,
      )
    : [],
);

const visibleMonthlyTopicSeries = computed(() =>
  trends.value
    ? filterSeries(
        trends.value.catalogGrowth.packageSubmissionsByTopicByMonth || [],
        topicQuery.value,
      )
    : [],
);

const visibleMonthlyDownloadTopicSeries = computed(() =>
  trends.value
    ? filterSeries(
        trends.value.downloads.downloadsPerMonthByTopic || [],
        topicQuery.value,
      )
    : [],
);

const latestPackageMonth = computed(() =>
  trends.value
    ? formatNumber(
        latestValue(trends.value.catalogGrowth.newPackageSubmissionsByMonth),
      )
    : "0",
);

const latestReleaseMonth = computed(() =>
  trends.value
    ? formatNumber(
        valueAtDate(
          trends.value.releaseActivity.releasesPerMonth,
          previousMonth(trends.value.generatedAt),
        ),
      )
    : "0",
);

const totalReleasesText = computed(() =>
  trends.value
    ? formatNumber(
        latestValue(trends.value.releaseActivity.totalReleasesByTime),
      )
    : "0",
);

const latestDownloadMonth = computed(() =>
  trends.value
    ? formatNumber(latestValue(trends.value.downloads.downloadsPerMonth))
    : "0",
);

const totalDownloadsText = computed(() =>
  trends.value
    ? formatNumber(latestValue(trends.value.downloads.totalDownloadsByTime))
    : "0",
);

async function fetchTrends(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const response = await axios.get(urlJoin(getAPIBaseUrl(), "/trends"), {
      headers: { Accept: "application/json" },
    });
    trends.value = response.data as PublicTrends;
  } catch {
    error.value = "Trends are temporarily unavailable.";
    trends.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void fetchTrends();
});
</script>

<style lang="scss">
.trends-page {
  max-width: none;
  margin: 0 auto;
  padding: 1rem 0.75rem 2rem;
  color: var(--c-text);
  font-size: 0.75rem;
}

.trends-page__header {
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.2rem;

  h1 {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: var(--c-text-light);
    font-size: 0.7rem;
  }
}

.trends-page__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: baseline;
}

.trends-page__updated {
  color: var(--c-text-lighter);
  font-size: 0.65rem;
}

.trends-page__notice {
  margin: 0.75rem 0;
  border: 1px solid var(--c-border);
  padding: 0.5rem 0.65rem;
  background: var(--c-bg-light);
  color: var(--c-text);

  &.is-error {
    border-color: #f1aeb5;
    background: #fff5f5;
    color: #b42318;
  }
}

.trends-page__section {
  margin-top: 1rem;
}

.trends-page__section-title {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: baseline;
  justify-content: space-between;

  h2 {
    margin: 0 0 0.4rem;
    border-bottom-width: 0;
    font-size: 0.8rem;
    line-height: 1.2;
  }

  span {
    color: var(--c-text-lighter);
    font-size: 0.65rem;
  }
}

.trends-page__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  margin-bottom: 0.75rem;
  border: 1px solid var(--c-border);

  div {
    display: grid;
    gap: 0.1rem;
    border-right: 1px solid var(--c-border);
    padding: 0.45rem 0.55rem;

    &:last-child {
      border-right: 0;
    }
  }

  span {
    color: var(--c-text-lighter);
    font-size: 0.68rem;
    text-transform: uppercase;
  }

  strong {
    font-size: 0.72rem;
    line-height: 1.1;
  }
}

.trends-chart {
  margin-bottom: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--c-border) 78%, #d7dee8);
  padding: 0.6rem;
  background: linear-gradient(180deg, #f8fafc 0%, var(--c-bg-light) 100%);
}

.trends-chart__title {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.45rem;

  h3 {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.2;
  }

  p {
    margin: 0.12rem 0 0;
    color: var(--c-text-light);
    font-size: 0.68rem;
    line-height: 1.25;
  }

  strong {
    font-size: 0.7rem;
  }
}

.trends-chart__filter {
  min-width: 10rem;
  max-width: 16rem;
  border: 1px solid var(--c-border);
  border-radius: 4px;
  padding: 0.25rem 0.35rem;
  background: var(--c-bg);
  color: var(--c-text);
  font-size: 0.68rem;
}

.trends-echart {
  display: block;
  width: 100%;
  height: 13rem;
  background: linear-gradient(
      to bottom,
      rgba(148, 163, 184, 0.12) 1px,
      transparent 1px
    ),
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.72),
      rgba(241, 245, 249, 0.68)
    );
  background-size:
    100% 25%,
    12.5% 100%,
    100% 100%;
}

.trends-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.4rem;
  overflow: visible;
  margin-top: 0.45rem;
  color: var(--c-text-light);
  font-size: 0.65rem;

  span {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 0.08rem 0.22rem;
    cursor: pointer;
    opacity: 0.72;
    transition:
      background-color 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease,
      opacity 0.12s ease,
      font-weight 0.12s ease;

    &:focus-visible {
      outline: 2px solid var(--series-color);
      outline-offset: 2px;
    }
  }

  span.is-active,
  span.is-isolated {
    border-color: color-mix(in srgb, var(--series-color) 46%, transparent);
    background: color-mix(in srgb, var(--series-color) 16%, transparent);
    color: var(--c-text);
    font-weight: 600;
    opacity: 1;
  }

  span::before {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    margin-right: 0.25rem;
    background: var(--series-color);
    content: "";
    vertical-align: -0.05rem;
  }
}

.trends-chart__snapshot {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.8rem;
  align-items: baseline;
  margin-top: 0.45rem;
  border-top: 1px solid color-mix(in srgb, var(--c-border) 70%, transparent);
  padding-top: 0.45rem;
  color: var(--c-text-light);
  font-size: 0.66rem;

  strong {
    color: var(--c-text);
    font-size: 0.68rem;
  }

  span::before {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-right: 0.25rem;
    background: var(--series-color);
    content: "";
    vertical-align: -0.04rem;
  }
}

.trends-table-wrap {
  overflow-x: auto;
}

.trends-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.68rem;

  th,
  td {
    border-bottom: 1px solid var(--c-border);
    padding: 0.35rem 0.4rem;
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: var(--c-text-lighter);
    font-size: 0.62rem;
    text-transform: uppercase;
  }
}

@media (max-width: 800px) {
  .trends-page__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    div {
      border-bottom: 1px solid var(--c-border);
    }
  }
}

:is(.dark, [data-theme="dark"]) {
  .trends-chart {
    border-color: color-mix(in srgb, var(--c-border) 78%, #334155);
    background: linear-gradient(180deg, #1f2937 0%, var(--c-bg-light) 100%);
  }

  .trends-echart {
    background: linear-gradient(
        to bottom,
        rgba(148, 163, 184, 0.16) 1px,
        transparent 1px
      ),
      linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
      linear-gradient(180deg, rgba(15, 23, 42, 0.84), rgba(17, 24, 39, 0.72));
    background-size:
      100% 25%,
      12.5% 100%,
      100% 100%;
  }

  .trends-page__notice {
    &.is-error {
      border-color: rgba(255, 138, 128, 0.42);
      background: rgba(180, 35, 24, 0.14);
      color: #ff8a80;
    }
  }
}
</style>
