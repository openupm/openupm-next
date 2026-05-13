<template>
  <main class="queue-status">
    <header class="queue-status__header">
      <div>
        <h1>Queue Status</h1>
        <p v-if="status">{{ status.summary.message }}</p>
        <p v-else-if="loading">Loading public queue status...</p>
        <p v-else-if="error">{{ error }}</p>
      </div>
      <div v-if="status" class="queue-status__meta">
        <span :class="['queue-status__state', `is-${status.summary.state}`]">
          {{ status.summary.state }}
        </span>
        <span>Updated {{ formatRelativeTime(status.generatedAt, nowMs) }}</span>
        <span
          >Cache {{ status.cache.state }}, {{ status.cache.ttlSeconds }}s</span
        >
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
          <h2>Package Scan Queue</h2>
        </div>
        <div class="queue-status__metrics">
          <div>
            <span>Active</span><strong>{{ status.packageQueue.active }}</strong>
          </div>
          <div>
            <span>Failed Jobs</span
            ><strong>{{ status.packageQueue.failed }}</strong>
          </div>
          <div>
            <span>Workers</span
            ><strong>{{ status.packageQueue.workers }}</strong>
          </div>
        </div>
      </section>

      <QueueStatusTable
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
          <td>{{ release.reason }}</td>
          <td>{{ release.retryable ? "yes" : "no" }}</td>
        </tr>
      </QueueStatusTable>

      <QueueStatusTable
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
import { onMounted, ref } from "vue";
import { getAPIBaseUrl } from "@openupm/common/build/urls.js";
import {
  PublicQueueStatus,
  formatDuration,
  formatRelativeTime,
  isQueueStatusEmpty,
  packageUrl,
} from "../queueStatusView";
import QueueStatusTable from "./QueueStatusTable.vue";

const loading = ref(true);
const error = ref("");
const status = ref<PublicQueueStatus | null>(null);
const nowMs = ref(Date.now());

async function fetchQueueStatus(): Promise<void> {
  loading.value = true;
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
    status.value = null;
    error.value = "Queue status is temporarily unavailable.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchQueueStatus);
</script>

<style lang="scss">
.queue-status {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  color: #1f2933;
}

.queue-status__header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid #d9e2ec;
  padding-bottom: 1rem;

  h1 {
    margin: 0 0 0.35rem;
    font-size: 2rem;
    line-height: 1.15;
  }

  p {
    margin: 0;
    color: #52606d;
  }
}

.queue-status__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  color: #52606d;
  font-size: 0.9rem;
}

.queue-status__state {
  color: #102a43;
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

.queue-status__notice {
  margin: 1rem 0;
  border: 1px solid #bcccdc;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  color: #334e68;

  &.is-error {
    border-color: #f1aeb5;
    background: #fff5f5;
    color: #b42318;
  }
}

.queue-status__section {
  margin-top: 1.5rem;
  border-top: 1px solid #d9e2ec;
  padding-top: 1rem;
}

.queue-status__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    line-height: 1.2;
  }
}

.queue-status__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  border: 1px solid #d9e2ec;

  div {
    display: grid;
    gap: 0.2rem;
    border-right: 1px solid #d9e2ec;
    padding: 0.75rem;

    &:last-child {
      border-right: 0;
    }
  }

  span {
    color: #627d98;
    font-size: 0.78rem;
    text-transform: uppercase;
  }

  strong {
    font-size: 1.35rem;
    line-height: 1.1;
  }
}

.queue-status__error {
  max-width: 34rem;
  white-space: normal;
}

@media (max-width: 720px) {
  .queue-status__header {
    display: block;
  }

  .queue-status__meta {
    justify-content: flex-start;
    margin-top: 0.75rem;
  }

  .queue-status__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    div {
      border-bottom: 1px solid #d9e2ec;
    }
  }
}
</style>
