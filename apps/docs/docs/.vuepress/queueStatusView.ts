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
  buildId?: string;
  reason?: string;
  reasonCode?: number;
}

export interface PublicReleaseSummary {
  package: string;
  version: string;
  state: string;
  reason: string;
  reasonCode: number;
  updatedAt: string;
  buildId?: string;
  source: "git" | "githubRelease";
  signed: boolean;
  githubReleaseAssetMissingFirstSeenAt?: number;
  githubReleaseAssetMissingLastProbeAt?: number;
  githubReleaseAssetMissingProbeCount?: number;
  retryable?: boolean;
  attempts?: number;
  maxAttempts?: number;
  nextRetryAt?: string;
  retryState?:
    | "not_retryable"
    | "scheduled"
    | "waiting"
    | "active"
    | "exhausted"
    | "ready_to_requeue";
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
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
    workers: number;
    oldestWaitingMs: number | null;
    nextScanAt: string | null;
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
    status.packageQueue.waiting === 0 &&
    status.packageQueue.delayed === 0 &&
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

export function formatCountdown(
  value: string | null,
  nowMs = Date.now(),
): string {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const remaining = timestamp - nowMs;
  if (remaining <= 0) return "Next scan soon";
  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  if (remaining < minute) {
    return `Next scan in ${Math.ceil(remaining / second)}s`;
  }
  if (remaining < hour) {
    return `Next scan in ${Math.floor(remaining / minute)}m`;
  }
  return `Next scan in ${formatDuration(remaining)}`;
}

function formatRetryAttempts(release: PublicReleaseSummary): string {
  if (
    typeof release.attempts !== "number" ||
    typeof release.maxAttempts !== "number"
  ) {
    return "yes";
  }
  return `yes, ${release.attempts}/${release.maxAttempts}`;
}

function formatNextRetry(value: string | undefined, nowMs: number): string {
  if (!value) return "soon";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "soon";
  const remaining = Math.max(0, timestamp - nowMs);
  if (remaining <= 0) return "soon";
  if (remaining < 60 * 1000) return `${Math.ceil(remaining / 1000)}s`;
  return formatDuration(remaining);
}

export function formatReleaseRetryable(
  release: PublicReleaseSummary,
  nowMs = Date.now(),
): string {
  if (release.retryable !== true || release.retryState === "not_retryable") {
    return "no";
  }

  const prefix = formatRetryAttempts(release);
  const pendingGitHubReleaseText =
    release.reason === "GitHubReleaseNotFound"
      ? "waiting for GitHub Release"
      : release.reason === "GitHubReleaseAssetNotFound"
        ? "waiting for GitHub Release asset"
        : "";
  switch (release.retryState) {
    case "scheduled":
      if (pendingGitHubReleaseText) {
        return `yes, ${pendingGitHubReleaseText}, next in ${formatNextRetry(
          release.nextRetryAt,
          nowMs,
        )}`;
      }
      return `${prefix}, next in ${formatNextRetry(
        release.nextRetryAt,
        nowMs,
      )}`;
    case "waiting":
      return `${prefix}, waiting`;
    case "active":
      return `${prefix}, running`;
    case "exhausted":
      if (pendingGitHubReleaseText) {
        return `yes, ${pendingGitHubReleaseText}`;
      }
      return `${prefix}, exhausted`;
    case "ready_to_requeue":
    case undefined:
      return "yes, ready to requeue";
    case "not_retryable":
      return "no";
  }
}

export function packageUrl(packageName: string): string {
  return `/packages/${encodeURIComponent(packageName)}/`;
}
