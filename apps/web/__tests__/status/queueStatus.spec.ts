import { describe, expect, it, vi } from 'vitest';
import { ReleaseErrorCode, ReleaseState } from '@openupm/types';

import {
  buildPublicQueueStatus,
  createQueueStatusCache,
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

describe('buildPublicQueueStatus', () => {
  it('shapes and sanitizes the public queue response', async () => {
    const now = 1_700_000_120_000;
    const packageQueue = createQueue({
      counts: { active: 4, failed: 1, waiting: 5000, delayed: 1000 },
      workers: [{ private: 'worker-host' }],
      jobs: {
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
            buildId: '',
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
      { jobLimit: 20, releaseLimit: 20, ttlSeconds: 10 },
    );

    expect(status.generatedAt).toEqual(new Date(now).toISOString());
    expect(status.packageQueue).toMatchObject({
      active: 4,
      failed: 1,
      workers: 1,
    });
    expect(status.packageQueue).not.toHaveProperty('waiting');
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
    expect(JSON.stringify(status)).not.toContain('/srv/private/path');
  });

  it('limits job and release rows', async () => {
    const packageQueue = createQueue({
      counts: { active: 0, failed: 3 },
      jobs: {
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
  });
});

describe('createQueueStatusCache', () => {
  it('single-flights the first refresh and returns stale data while refreshing', async () => {
    let now = 0;
    let resolveRefresh: (value: unknown) => void = () => undefined;
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveRefresh = resolve;
      });
      return {
        generatedAt: new Date(now).toISOString(),
        cache: { state: 'fresh' as const, ttlSeconds: 10 },
        summary: { state: 'healthy' as const, message: 'ok' },
        packageQueue: { active: 0, failed: 0, workers: 0, failedJobs: [] },
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
    const cache = createQueueStatusCache(refresh, 10, () => now);

    const first = cache.get();
    const second = cache.get();
    expect(refresh).toHaveBeenCalledTimes(1);
    resolveRefresh(undefined);
    await expect(first).resolves.toMatchObject({ cache: { state: 'fresh' } });
    await expect(second).resolves.toMatchObject({ cache: { state: 'fresh' } });

    now = 11_000;
    const stale = await cache.get();
    expect(stale.cache.state).toEqual('stale');
    expect(refresh).toHaveBeenCalledTimes(2);
    resolveRefresh(undefined);
  });

  it('serves stale data when a background refresh fails', async () => {
    let now = 0;
    const refresh = vi
      .fn()
      .mockResolvedValueOnce({
        generatedAt: new Date(now).toISOString(),
        cache: { state: 'fresh' as const, ttlSeconds: 10 },
        summary: { state: 'healthy' as const, message: 'ok' },
        packageQueue: { active: 0, failed: 0, workers: 0, failedJobs: [] },
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
    const cache = createQueueStatusCache(refresh, 10, () => now);

    await expect(cache.get()).resolves.toMatchObject({
      cache: { state: 'fresh' },
    });
    now = 11_000;
    await expect(cache.get()).resolves.toMatchObject({
      cache: { state: 'stale' },
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
