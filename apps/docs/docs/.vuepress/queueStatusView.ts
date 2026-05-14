export interface PublicQueueJobSummary {
  package: string;
  version?: string;
  state: string;
  timestamp?: string;
  processedAt?: string;
  finishedAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
}

export interface PublicReleaseSummary {
  package: string;
  version: string;
  state: string;
  reason: string;
  updatedAt: string;
  buildId?: string;
  source: "git" | "githubRelease";
  signed: boolean;
  retryable?: boolean;
}

export interface PublicQueueStatus {
  generatedAt: string;
  cache: {
    state: "fresh" | "stale";
    ttlSeconds: number;
  };
  summary: {
    state: "healthy" | "backlog" | "degraded";
    message: string;
  };
  packageQueue: {
    active: number;
    failed: number;
    workers: number;
    failedJobs: PublicQueueJobSummary[];
  };
  releaseQueue: {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
    workers: number;
    oldestWaitingMs: number | null;
    activeJobs: PublicQueueJobSummary[];
    waitingJobs: PublicQueueJobSummary[];
  };
  recentSuccessfulReleases: PublicReleaseSummary[];
  recentFailedReleases: PublicReleaseSummary[];
  retainedFailedReleaseJobs: PublicQueueJobSummary[];
}

export function isQueueStatusEmpty(status: PublicQueueStatus): boolean {
  return (
    status.packageQueue.active === 0 &&
    status.packageQueue.failed === 0 &&
    status.releaseQueue.waiting === 0 &&
    status.releaseQueue.active === 0 &&
    status.releaseQueue.delayed === 0 &&
    status.releaseQueue.failed === 0 &&
    status.packageQueue.failedJobs.length === 0 &&
    status.releaseQueue.activeJobs.length === 0 &&
    status.releaseQueue.waitingJobs.length === 0 &&
    status.recentSuccessfulReleases.length === 0 &&
    status.recentFailedReleases.length === 0 &&
    status.retainedFailedReleaseJobs.length === 0
  );
}

export function formatRelativeTime(
  value: string | undefined,
  nowMs = Date.now(),
): string {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const elapsed = Math.max(0, nowMs - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (elapsed < minute) return "just now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m ago`;
  if (elapsed < day) {
    const hours = Math.floor(elapsed / hour);
    const minutes = Math.floor((elapsed % hour) / minute);
    return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
  }
  return `${Math.floor(elapsed / day)}d ago`;
}

export function formatDuration(value: number | null): string {
  if (value === null) return "";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (value < minute) return "<1m";
  if (value < hour) return `${Math.floor(value / minute)}m`;
  if (value < day) {
    const hours = Math.floor(value / hour);
    const minutes = Math.floor((value % hour) / minute);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${Math.floor(value / day)}d`;
}

export function packageUrl(packageName: string): string {
  return `/packages/${encodeURIComponent(packageName)}/`;
}
