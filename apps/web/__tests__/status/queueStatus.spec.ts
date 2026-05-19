import { describe, expect, it, vi } from 'vitest';
import { ReleaseErrorCode, ReleaseModel, ReleaseState } from '@openupm/types';

import {
  buildPublicQueueStatus,
  createQueueStatusCache,
  getNextPackageScanAt,
  parseReleaseJobIdentity,
} from '../../src/status/queueStatus.js';

function createJob(params: {
  id?: string;
  data?: unknown;
  state?: string;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade?: number;
  attempts?: number;
  failedReason?: string;
}) {
  return {
    id: params.id,
    name: 'job',
    data: params.data ?? {},
    attemptsMade: params.attemptsMade ?? 0,
    opts: { attempts: params.attempts ?? 3 },
    timestamp: params.timestamp ?? 1_700_000_000_000,
    processedOn: params.processedOn,
    finishedOn: params.finishedOn,
    failedReason: params.failedReason,
    getState: vi.fn(async () => params.state ?? 'waiting'),
  };
}

function createQueue(params: {
  counts: Record<string, number>;
  workers?: unknown[];
  jobs?: Record<string, ReturnType<typeof createJob>[]>;
  delayedScores?: Record<string, number>;
}) {
  return {
    getJobCounts: vi.fn(async (...types: string[]) => {
      return Object.fromEntries(
        types.map((type) => [type, params.counts[type] ?? 0]),
      );
    }),
    getWorkers: vi.fn(async () => params.workers ?? []),
    getJobs: vi.fn(async (types: string | string[], _start, end, asc) => {
      const names = Array.isArray(types) ? types : [types];
      const jobs = names.flatMap((name) => params.jobs?.[name] ?? []);
      const sorted = asc
        ? [...jobs].sort((a, b) => a.timestamp - b.timestamp)
        : [...jobs].sort((a, b) => b.timestamp - a.timestamp);
      return sorted.slice(0, (end ?? sorted.length - 1) + 1);
    }),
    client: Promise.resolve({
      zscore: vi.fn(async (_key: string, member: string) => {
        const score = params.delayedScores?.[member];
        return typeof score === 'number' ? `${score}` : null;
      }),
    }),
    toKey: vi.fn((type: string) => `queue:${type}`),
  };
}

describe('parseReleaseJobIdentity', () => {
  it('parses package and version from job data first', () => {
    expect(
      parseReleaseJobIdentity({
        id: 'build-rel|wrong|0.0.1',
        data: { packageName: 'com.example.runtime', version: '1.2.3' },
      }),
    ).toEqual({ packageName: 'com.example.runtime', version: '1.2.3' });
  });

  it('parses deterministic encoded release job ids', () => {
    expect(
      parseReleaseJobIdentity({
        id: 'build-rel|com.example.camera|1.0.0-preview%2Bbuild',
        data: {},
      }),
    ).toEqual({
      packageName: 'com.example.camera',
      version: '1.0.0-preview+build',
    });
  });
});

describe('getNextPackageScanAt', () => {
  it('returns the next package scan cron timestamp', () => {
    expect(getNextPackageScanAt(Date.parse('2026-05-14T10:02:45.000Z'))).toBe(
      '2026-05-14T10:05:00.000Z',
    );
  });
});

describe('buildPublicQueueStatus', () => {
  it('shapes and sanitizes the public queue response', async () => {
    const now = 1_700_000_120_000;
    const packageQueue = createQueue({
      counts: { active: 4, failed: 1, waiting: 5000, delayed: 1000 },
      workers: [{ private: 'worker-host' }],
      jobs: {
        waiting: [
          createJob({
            id: 'build-pkg|com.old.waiting',
            state: 'waiting',
            timestamp: now - 120_000,
          }),
        ],
        failed: [
          createJob({
            id: 'build-pkg|com.bad.repo',
            state: 'failed',
            attemptsMade: 3,
            failedReason:
              'git ls-remote failed\nstack trace with /srv/private/path',
          }),
        ],
      },
    });
    const releaseQueue = createQueue({
      counts: { waiting: 2, active: 1, delayed: 3, failed: 1 },
      workers: [{ name: 'worker' }, { name: 'worker2' }],
      jobs: {
        active: [
          createJob({
            id: 'build-rel|com.active.pkg|2.0.0',
            state: 'active',
            timestamp: now - 10_000,
            attemptsMade: 1,
          }),
        ],
        waiting: [
          createJob({
            id: 'build-rel|com.waiting.old|1.0.0',
            state: 'waiting',
            timestamp: now - 60_000,
          }),
          createJob({
            id: 'build-rel|com.waiting.new|1.0.1',
            state: 'waiting',
            timestamp: now - 10_000,
          }),
        ],
        failed: [
          createJob({
            id: 'build-rel|com.failed.pkg|3.0.0',
            state: 'failed',
            finishedOn: now - 5_000,
            attemptsMade: 3,
            failedReason: 'build failed because package.json was invalid',
          }),
        ],
      },
    });

    const status = await buildPublicQueueStatus(
      {
        packageQueue,
        releaseQueue,
        getRecentSuccessfulReleases: async () => [
          {
            packageName: 'com.success.pkg',
            version: '1.0.0',
            state: ReleaseState.Succeeded,
            reason: ReleaseErrorCode.None,
            commit: '',
            tag: '',
            buildId: '',
            createdAt: now,
            updatedAt: now,
            source: 'githubRelease',
            signed: true,
          },
        ],
        getRecentFailedReleases: async () => [
          {
            packageName: 'com.retry.pkg',
            version: '1.0.0',
            state: ReleaseState.Failed,
            reason: ReleaseErrorCode.BuildTimeout,
            commit: '',
            tag: '',
            buildId: '12345',
            createdAt: now,
            updatedAt: now - 1,
            source: 'git',
            signed: false,
          },
          {
            packageName: 'com.final.pkg',
            version: '1.0.0',
            state: ReleaseState.Failed,
            reason: ReleaseErrorCode.VersionConflict,
            commit: '',
            tag: '',
            buildId: '',
            createdAt: now,
            updatedAt: now - 2,
            source: 'git',
            signed: false,
          },
        ],
        now: () => now,
      },
      { jobLimit: 20, releaseLimit: 20, ttlSeconds: 15 },
    );

    expect(status.generatedAt).toEqual(new Date(now).toISOString());
    expect(status.packageQueue).toMatchObject({
      waiting: 5000,
      active: 4,
      delayed: 1000,
      failed: 1,
      workers: 1,
      oldestWaitingMs: 120_000,
      nextScanAt: '2023-11-14T22:20:00.000Z',
    });
    expect(status.packageQueue.failedJobs[0]).toMatchObject({
      package: 'com.bad.repo',
      attempts: 3,
      maxAttempts: 3,
      error: 'git ls-remote failed',
    });
    expect(status.releaseQueue.waitingJobs.map((job) => job.package)).toEqual([
      'com.waiting.old',
      'com.waiting.new',
    ]);
    expect(status.releaseQueue.oldestWaitingMs).toEqual(60_000);
    expect(status.recentSuccessfulReleases[0]).toMatchObject({
      package: 'com.success.pkg',
      source: 'githubRelease',
      signed: true,
    });
    expect(
      status.recentFailedReleases.map((release) => release.retryable),
    ).toEqual([true, false]);
    expect(status.recentFailedReleases[0]).toMatchObject({
      reason: 'BuildTimeout',
      buildId: '12345',
      retryState: 'ready_to_requeue',
    });
    expect(JSON.stringify(status)).not.toContain('/srv/private/path');
  });

  it('limits job and release rows', async () => {
    const packageQueue = createQueue({
      counts: { active: 0, failed: 3 },
      jobs: {
        waiting: [
          createJob({
            id: 'build-pkg|com.old.waiting',
            timestamp: 1_700_000_000_000,
          }),
        ],
        failed: [
          createJob({ id: 'build-pkg|com.one' }),
          createJob({ id: 'build-pkg|com.two' }),
          createJob({ id: 'build-pkg|com.three' }),
        ],
      },
    });
    const releaseQueue = createQueue({
      counts: { waiting: 0, active: 0, delayed: 0, failed: 0 },
    });

    const status = await buildPublicQueueStatus(
      {
        packageQueue,
        releaseQueue,
        getRecentSuccessfulReleases: async (limit) =>
          Array.from({ length: limit + 1 }, (_, index) => ({
            packageName: `com.pkg.${index}`,
            version: '1.0.0',
            state: ReleaseState.Succeeded,
            reason: ReleaseErrorCode.None,
            commit: '',
            tag: '',
            buildId: '',
            createdAt: index,
            updatedAt: index,
          })),
        getRecentFailedReleases: async () => [],
      },
      { jobLimit: 2, releaseLimit: 2 },
    );

    expect(status.packageQueue.failedJobs).toHaveLength(2);
    expect(status.recentSuccessfulReleases).toHaveLength(2);
    expect(packageQueue.getJobs).toHaveBeenCalledWith(['failed'], 0, 1, false);
    expect(packageQueue.getJobs).toHaveBeenCalledWith(['waiting'], 0, 0, true);
    expect(releaseQueue.getJobs).toHaveBeenCalledWith(['delayed'], 0, 1, true);
  });

  it('adds retry state details to recent failed releases', async () => {
    const now = Date.parse('2026-05-14T10:00:00.000Z');
    const packageQueue = createQueue({
      counts: { waiting: 0, active: 0, delayed: 0, failed: 0 },
    });
    const releaseQueue = createQueue({
      counts: { waiting: 1, active: 1, delayed: 1, failed: 1 },
      jobs: {
        delayed: [
          createJob({
            id: 'build-rel|com.retry.scheduled|1.0.0',
            state: 'delayed',
            timestamp: now - 300_000,
            attemptsMade: 1,
            attempts: 3,
          }),
        ],
        waiting: [
          createJob({
            id: 'build-rel|com.retry.waiting|1.0.0',
            state: 'waiting',
            attemptsMade: 1,
            attempts: 3,
          }),
        ],
        active: [
          createJob({
            id: 'build-rel|com.retry.running|1.0.0',
            state: 'active',
            attemptsMade: 2,
            attempts: 3,
          }),
        ],
        failed: [
          createJob({
            id: 'build-rel|com.retry.exhausted|1.0.0',
            state: 'failed',
            attemptsMade: 3,
            attempts: 3,
          }),
          createJob({
            id: 'build-rel|com.retry.not-exhausted|1.0.0',
            state: 'failed',
            attemptsMade: 1,
            attempts: 3,
          }),
        ],
      },
      delayedScores: {
        'build-rel|com.retry.scheduled|1.0.0': (now + 18_000) * 0x1000,
      },
    });
    const release = (
      packageName: string,
      reason: ReleaseErrorCode,
    ): ReleaseModel => ({
      packageName,
      version: '1.0.0',
      state: ReleaseState.Failed,
      reason,
      commit: '',
      tag: '',
      buildId: '',
      createdAt: now,
      updatedAt: now,
      source: 'git',
      signed: false,
    });

    const status = await buildPublicQueueStatus(
      {
        packageQueue,
        releaseQueue,
        getRecentSuccessfulReleases: async () => [],
        getRecentFailedReleases: async () => [
          release('com.retry.scheduled', ReleaseErrorCode.BuildTimeout),
          release('com.retry.waiting', ReleaseErrorCode.ConnectionTimeout),
          release(
            'com.retry.running',
            ReleaseErrorCode.GitHubReleaseApiError,
          ),
          release('com.retry.exhausted', ReleaseErrorCode.BuildTimeout),
          release('com.retry.ready', ReleaseErrorCode.ConnectionTimeout),
          release('com.retry.not-exhausted', ReleaseErrorCode.BuildTimeout),
          release('com.no.retry', ReleaseErrorCode.PackageNotFound),
        ],
        now: () => now,
      },
      { jobLimit: 20, releaseLimit: 20 },
    );

    expect(status.recentFailedReleases).toMatchObject([
      {
        package: 'com.retry.scheduled',
        retryable: true,
        retryState: 'scheduled',
        attempts: 1,
        maxAttempts: 3,
        nextRetryAt: '2026-05-14T10:00:18.000Z',
      },
      {
        package: 'com.retry.waiting',
        retryable: true,
        retryState: 'waiting',
        attempts: 1,
        maxAttempts: 3,
      },
      {
        package: 'com.retry.running',
        retryable: true,
        retryState: 'active',
        attempts: 2,
        maxAttempts: 3,
      },
      {
        package: 'com.retry.exhausted',
        retryable: true,
        retryState: 'exhausted',
        attempts: 3,
        maxAttempts: 3,
      },
      {
        package: 'com.retry.ready',
        retryable: true,
        retryState: 'ready_to_requeue',
      },
      {
        package: 'com.retry.not-exhausted',
        retryable: true,
        retryState: 'ready_to_requeue',
      },
      {
        package: 'com.no.retry',
        retryable: false,
        retryState: 'not_retryable',
      },
    ]);
  });
});

describe('createQueueStatusCache', () => {
  it('single-flights refreshes and waits for expired cache refreshes', async () => {
    let now = 0;
    let resolveRefresh: (value: unknown) => void = () => undefined;
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveRefresh = resolve;
      });
      return {
        generatedAt: new Date(now).toISOString(),
        cache: { state: 'fresh' as const, ttlSeconds: 15 },
        summary: { state: 'healthy' as const, message: 'ok' },
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
      };
    });
    const cache = createQueueStatusCache(refresh, 15, () => now);

    const first = cache.get();
    const second = cache.get();
    expect(refresh).toHaveBeenCalledTimes(1);
    resolveRefresh(undefined);
    await expect(first).resolves.toMatchObject({ cache: { state: 'fresh' } });
    await expect(second).resolves.toMatchObject({ cache: { state: 'fresh' } });

    now = 16_000;
    const refreshed = cache.get();
    expect(refresh).toHaveBeenCalledTimes(2);
    resolveRefresh(undefined);
    await expect(refreshed).resolves.toMatchObject({
      generatedAt: new Date(now).toISOString(),
      cache: { state: 'fresh', ttlSeconds: 15 },
    });
  });

  it('serves stale data when an expired cache refresh fails', async () => {
    let now = 0;
    const refresh = vi
      .fn()
      .mockResolvedValueOnce({
        generatedAt: new Date(now).toISOString(),
        cache: { state: 'fresh' as const, ttlSeconds: 15 },
        summary: { state: 'healthy' as const, message: 'ok' },
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
      })
      .mockRejectedValueOnce(new Error('redis unavailable'));
    const cache = createQueueStatusCache(refresh, 15, () => now);

    await expect(cache.get()).resolves.toMatchObject({
      cache: { state: 'fresh' },
    });
    now = 16_000;
    await expect(cache.get()).resolves.toMatchObject({
      cache: { state: 'stale', ttlSeconds: 15 },
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
