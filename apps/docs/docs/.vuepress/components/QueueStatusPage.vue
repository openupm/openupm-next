<template>
  <main class="queue-status">
    <header class="queue-status__header">
      <div class="queue-status__intro">
        <div class="queue-status__title-row">
          <h1>Queue Status</h1>
          <span
            v-if="status"
            :class="['queue-status__state', `is-${status.summary.state}`]"
          >
            {{ status.summary.state }}
          </span>
          <span v-if="status" class="queue-status__updated">
            Updated {{ formatRelativeTime(status.generatedAt, nowMs) }}
          </span>
        </div>
        <p v-if="status">{{ status.summary.message }}</p>
        <p v-else-if="loading">Loading public queue status...</p>
        <p v-else-if="error">{{ error }}</p>
      </div>
    </header>

    <div v-if="loading" class="queue-status__notice">Loading...</div>
    <div v-else-if="error" class="queue-status__notice is-error">
      {{ error }}
    </div>
    <div
      v-else-if="status && isQueueStatusEmpty(status)"
      class="queue-status__notice"
    >
      No active, waiting, delayed, failed, or recent release records are
      visible.
    </div>

    <template v-if="status">
      <section class="queue-status__section">
        <div class="queue-status__section-title">
          <h2>
            Package Scan Queue
            <span v-if="packageNextScanText" class="queue-status__section-meta">
              {{ packageNextScanText }}
            </span>
          </h2>
        </div>
        <div class="queue-status__metrics">
          <div>
            <span>Waiting</span
            ><strong>{{ status.packageQueue.waiting }}</strong>
          </div>
          <div>
            <span>Active</span><strong>{{ status.packageQueue.active }}</strong>
          </div>
          <div>
            <span>Delayed</span
            ><strong>{{ status.packageQueue.delayed }}</strong>
          </div>
          <div>
            <span>Failed Jobs</span
            ><strong>{{ status.packageQueue.failed }}</strong>
          </div>
          <div>
            <span>Workers</span
            ><strong>{{ status.packageQueue.workers }}</strong>
          </div>
          <div>
            <span>Oldest Waiting</span>
            <strong>{{
              formatDuration(status.packageQueue.oldestWaitingMs) || "-"
            }}</strong>
          </div>
        </div>
      </section>

      <QueueStatusTable
        v-if="status.packageQueue.failedJobs.length > 0"
        title="Failed Package Scan Jobs"
        :columns="['Package', 'Failed', 'Attempts', 'Last Error']"
        :empty="status.packageQueue.failedJobs.length === 0"
      >
        <tr
          v-for="job in status.packageQueue.failedJobs"
          :key="`pkg-${job.package}`"
        >
          <td>
            <a :href="packageUrl(job.package)">{{ job.package }}</a>
          </td>
          <td>
            {{ formatRelativeTime(job.finishedAt || job.timestamp, nowMs) }}
          </td>
          <td>{{ job.attempts }}/{{ job.maxAttempts }}</td>
          <td class="queue-status__error">{{ job.error || "" }}</td>
        </tr>
      </QueueStatusTable>

      <section class="queue-status__section">
        <div class="queue-status__section-title">
          <h2>Release Build Queue</h2>
        </div>
        <div class="queue-status__metrics">
          <div>
            <span>Waiting</span
            ><strong>{{ status.releaseQueue.waiting }}</strong>
          </div>
          <div>
            <span>Active</span><strong>{{ status.releaseQueue.active }}</strong>
          </div>
          <div>
            <span>Delayed</span
            ><strong>{{ status.releaseQueue.delayed }}</strong>
          </div>
          <div>
            <span>Failed Jobs</span
            ><strong>{{ status.releaseQueue.failed }}</strong>
          </div>
          <div>
            <span>Workers</span
            ><strong>{{ status.releaseQueue.workers }}</strong>
          </div>
          <div>
            <span>Oldest Waiting</span>
            <strong>{{
              formatDuration(status.releaseQueue.oldestWaitingMs) || "-"
            }}</strong>
          </div>
        </div>
      </section>

      <QueueStatusTable
        v-if="status.releaseQueue.activeJobs.length > 0"
        title="Active Release Builds"
        :columns="['Package', 'Version', 'Age', 'Attempts']"
        :empty="status.releaseQueue.activeJobs.length === 0"
      >
        <tr
          v-for="job in status.releaseQueue.activeJobs"
          :key="`active-${job.package}-${job.version}`"
        >
          <td>
            <a :href="packageUrl(job.package)">{{ job.package }}</a>
          </td>
          <td>{{ job.version }}</td>
          <td>
            {{ formatRelativeTime(job.processedAt || job.timestamp, nowMs) }}
          </td>
          <td>{{ job.attempts }}/{{ job.maxAttempts }}</td>
        </tr>
      </QueueStatusTable>

      <QueueStatusTable
        v-if="status.releaseQueue.waitingJobs.length > 0"
        title="Waiting Release Builds"
        :columns="['Package', 'Version', 'Queued']"
        :empty="status.releaseQueue.waitingJobs.length === 0"
      >
        <tr
          v-for="job in status.releaseQueue.waitingJobs"
          :key="`waiting-${job.package}-${job.version}`"
        >
          <td>
            <a :href="packageUrl(job.package)">{{ job.package }}</a>
          </td>
          <td>{{ job.version }}</td>
          <td>{{ formatRelativeTime(job.timestamp, nowMs) }}</td>
        </tr>
      </QueueStatusTable>

      <QueueStatusTable
        title="Recent Successful Releases"
        :columns="['Time', 'Package', 'Version', 'Source', 'Signed']"
        :empty="status.recentSuccessfulReleases.length === 0"
      >
        <tr
          v-for="release in status.recentSuccessfulReleases"
          :key="`success-${release.package}-${release.version}`"
        >
          <td>{{ formatRelativeTime(release.updatedAt, nowMs) }}</td>
          <td>
            <a :href="packageUrl(release.package)">{{ release.package }}</a>
          </td>
          <td>{{ release.version }}</td>
          <td>{{ release.source }}</td>
          <td>{{ release.signed ? "yes" : "no" }}</td>
        </tr>
      </QueueStatusTable>

      <QueueStatusTable
        title="Recent Failed Releases"
        :columns="['Time', 'Package', 'Version', 'Reason', 'Retryable']"
        :empty="status.recentFailedReleases.length === 0"
      >
        <tr
          v-for="release in status.recentFailedReleases"
          :key="`failed-release-${release.package}-${release.version}`"
        >
          <td>{{ formatRelativeTime(release.updatedAt, nowMs) }}</td>
          <td>
            <a :href="packageUrl(release.package)">{{ release.package }}</a>
          </td>
          <td>{{ release.version }}</td>
          <td>
            <a v-if="release.buildId" :href="releaseBuildUrl(release)">
              {{ releaseReasonText(release) }}
            </a>
            <span v-else>{{ releaseReasonText(release) }}</span>
          </td>
          <td>{{ release.retryable ? "yes" : "no" }}</td>
        </tr>
      </QueueStatusTable>

      <QueueStatusTable
        v-if="status.retainedFailedReleaseJobs.length > 0"
        title="Retained Failed Release Queue Jobs"
        :columns="['Package', 'Version', 'Failed', 'Attempts', 'Last Error']"
        :empty="status.retainedFailedReleaseJobs.length === 0"
      >
        <tr
          v-for="job in status.retainedFailedReleaseJobs"
          :key="`failed-job-${job.package}-${job.version}`"
        >
          <td>
            <a :href="packageUrl(job.package)">{{ job.package }}</a>
          </td>
          <td>{{ job.version }}</td>
          <td>
            {{ formatRelativeTime(job.finishedAt || job.timestamp, nowMs) }}
          </td>
          <td>{{ job.attempts }}/{{ job.maxAttempts }}</td>
          <td class="queue-status__error">{{ job.error || "" }}</td>
        </tr>
      </QueueStatusTable>
    </template>
  </main>
</template>

<script setup lang="ts">
import axios from "axios";
import urlJoin from "url-join";
import { paramCase } from "change-case";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  getAPIBaseUrl,
  getAzureWebBuildUrl,
} from "@openupm/common/build/urls.js";
import {
  PublicQueueStatus,
  PublicReleaseSummary,
  formatCountdown,
  formatDuration,
  formatRelativeTime,
  isQueueStatusEmpty,
  packageUrl,
} from "../queueStatusView";
import QueueStatusTable from "./QueueStatusTable.vue";

const { t } = useI18n();
const loading = ref(true);
const error = ref("");
const status = ref<PublicQueueStatus | null>(null);
const nowMs = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | undefined;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const packageNextScanText = computed(() =>
  status.value
    ? formatCountdown(status.value.packageQueue.nextScanAt, nowMs.value)
    : "",
);

function releaseReasonText(release: PublicReleaseSummary): string {
  const key = `release-reason-${paramCase(release.reason)}`;
  const value = t(key);
  return value === key ? release.reason : value;
}

function releaseBuildUrl(release: PublicReleaseSummary): string {
  return release.buildId ? getAzureWebBuildUrl(release.buildId) : "";
}

async function fetchQueueStatus(isInitial = false): Promise<void> {
  if (isInitial) loading.value = true;
  error.value = "";
  try {
    const response = await axios.get(
      urlJoin(getAPIBaseUrl(), "/queue/status"),
      {
        headers: { Accept: "application/json" },
      },
    );
    status.value = response.data as PublicQueueStatus;
    nowMs.value = Date.now();
  } catch {
    if (!status.value) {
      status.value = null;
      error.value = "Queue status is temporarily unavailable.";
    }
  } finally {
    if (isInitial) loading.value = false;
  }
}

onMounted(() => {
  void fetchQueueStatus(true);
  clockTimer = setInterval(() => {
    nowMs.value = Date.now();
  }, 1000);
  refreshTimer = setInterval(() => {
    void fetchQueueStatus(false);
  }, 15_000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style lang="scss">
.queue-status {
  max-width: none;
  margin: 0 auto;
  padding: 1rem 0.75rem 2rem;
  color: var(--c-text);
  font-size: 0.75rem;
}

.queue-status__header {
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.2rem;

  h1 {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: var(--c-text-light);
    font-size: 0.7rem;
  }
}

.queue-status__intro {
  display: grid;
  gap: 0.15rem;
}

.queue-status__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: baseline;
}

.queue-status__state {
  color: var(--c-text);
  font-weight: 700;
  text-transform: uppercase;

  &.is-healthy {
    color: #0b7285;
  }

  &.is-backlog {
    color: #8d6b00;
  }

  &.is-degraded {
    color: #b42318;
  }
}

.queue-status__updated {
  color: var(--c-text-lighter);
  font-size: 0.65rem;
}

.queue-status__notice {
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

.queue-status__section {
  margin-top: 0.9rem;
}

.queue-status__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0 0 0.4rem;
    font-size: 0.8rem;
    line-height: 1.2;
  }
}

.queue-status__section-meta {
  margin-left: 0.45rem;
  color: var(--c-text-lighter);
  font-size: 0.65rem;
  font-weight: 400;
  white-space: nowrap;
}

.queue-status__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
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
    font-size: 0.7rem;
    line-height: 1.1;
  }
}

.queue-status h2 {
  border-bottom-width: 0;
}

.queue-status__error {
  max-width: 34rem;
  white-space: normal;
}

@media (max-width: 720px) {
  .queue-status__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    div {
      border-bottom: 1px solid var(--c-border);
    }
  }
}

.dark {
  .queue-status__state {
    &.is-healthy {
      color: #4dd0e1;
    }

    &.is-backlog {
      color: #ffd166;
    }

    &.is-degraded {
      color: #ff8a80;
    }
  }

  .queue-status__notice {
    &.is-error {
      border-color: rgba(255, 138, 128, 0.42);
      background: rgba(180, 35, 24, 0.14);
      color: #ff8a80;
    }
  }
}
</style>
