import { describe, it } from "vitest";
import chai from "chai";
chai.should();

import {
  PublicQueueStatus,
  formatCountdown,
  formatDuration,
  formatReleaseRetryable,
  formatRelativeTime,
  isQueueStatusEmpty,
  packageUrl,
} from "@/queueStatusView";

function createStatus(
  overrides: Partial<PublicQueueStatus> = {},
): PublicQueueStatus {
  return {
    generatedAt: "2026-05-14T10:00:00.000Z",
    cache: { state: "fresh", ttlSeconds: 15 },
    summary: { state: "healthy", message: "ok" },
    packageQueue: {
      waiting: 0,
      active: 0,
      delayed: 0,
      failed: 0,
      workers: 0,
      oldestWaitingMs: null,
      nextScanAt: null,
      failedJobs: [],
    },
    releaseQueue: {
      waiting: 0,
      active: 0,
      delayed: 0,
      failed: 0,
      workers: 0,
      oldestWaitingMs: null,
      activeJobs: [],
      waitingJobs: [],
    },
    recentSuccessfulReleases: [],
    recentFailedReleases: [],
    retainedFailedReleaseJobs: [],
    ...overrides,
  };
}

describe("@/queueStatusView", () => {
  it("identifies empty and populated queue states", () => {
    isQueueStatusEmpty(createStatus()).should.equal(true);
    isQueueStatusEmpty(
      createStatus({
        packageQueue: {
          waiting: 1,
          active: 0,
          delayed: 0,
          failed: 0,
          workers: 0,
          oldestWaitingMs: 60_000,
          nextScanAt: null,
          failedJobs: [],
        },
      }),
    ).should.equal(false);
  });

  it("formats loading table times and durations compactly", () => {
    const now = new Date("2026-05-14T10:00:00.000Z").getTime();
    formatRelativeTime("2026-05-14T09:55:00.000Z", now).should.equal("5m ago");
    formatRelativeTime("2026-05-14T07:45:00.000Z", now).should.equal(
      "2h 15m ago",
    );
    formatDuration(2 * 60 * 60 * 1000 + 14 * 60 * 1000).should.equal("2h 14m");
    formatCountdown(
      "2026-05-14T10:02:15.000Z",
      now,
    ).should.equal("Next scan in 2m");
    formatCountdown(
      "2026-05-14T10:00:45.000Z",
      now,
    ).should.equal("Next scan in 45s");
    formatCountdown(
      "2026-05-14T10:00:59.500Z",
      now,
    ).should.equal("Next scan in 60s");
    formatCountdown(
      "2026-05-14T10:02:59.999Z",
      now,
    ).should.equal("Next scan in 2m");
    formatCountdown("2026-05-14T09:59:59.000Z", now).should.equal(
      "Next scan soon",
    );
  });

  it("builds package links with encoded names", () => {
    packageUrl("com.example.package").should.equal(
      "/packages/com.example.package/",
    );
    packageUrl("com.example/package").should.equal(
      "/packages/com.example%2Fpackage/",
    );
  });

  it("formats retryable release cells with retry state details", () => {
    const now = new Date("2026-05-14T10:00:00.000Z").getTime();
    const release = {
      package: "com.example.retry",
      version: "1.0.0",
      state: "Failed",
      reason: "BuildTimeout",
      updatedAt: "2026-05-14T09:59:00.000Z",
      source: "git" as const,
      signed: false,
      retryable: true,
    };

    formatReleaseRetryable(
      {
        ...release,
        attempts: 1,
        maxAttempts: 3,
        nextRetryAt: "2026-05-14T10:00:18.000Z",
        retryState: "scheduled",
      },
      now,
    ).should.equal("yes, 1/3, next in 18s");
    formatReleaseRetryable(
      { ...release, attempts: 1, maxAttempts: 3, retryState: "waiting" },
      now,
    ).should.equal("yes, 1/3, waiting");
    formatReleaseRetryable(
      { ...release, attempts: 2, maxAttempts: 3, retryState: "active" },
      now,
    ).should.equal("yes, 2/3, running");
    formatReleaseRetryable(
      { ...release, attempts: 3, maxAttempts: 3, retryState: "exhausted" },
      now,
    ).should.equal("yes, 3/3, exhausted");
    formatReleaseRetryable(
      { ...release, retryState: "ready_to_requeue" },
      now,
    ).should.equal("yes, ready to requeue");
    formatReleaseRetryable(
      { ...release, retryable: false, retryState: "not_retryable" },
      now,
    ).should.equal("no");
  });

  it("represents api error state as a non-empty absence of data", () => {
    const status = createStatus({
      summary: {
        state: "degraded",
        message: "Queue status is temporarily unavailable.",
      },
    });
    status.summary.state.should.equal("degraded");
    isQueueStatusEmpty(status).should.equal(true);
  });
});
