import { describe, it } from "vitest";
import chai from "chai";
chai.should();

import {
  PublicQueueStatus,
  formatDuration,
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
  });

  it("builds package links with encoded names", () => {
    packageUrl("com.example.package").should.equal(
      "/packages/com.example.package/",
    );
    packageUrl("com.example/package").should.equal(
      "/packages/com.example%2Fpackage/",
    );
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
