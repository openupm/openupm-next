import configRaw from 'config';
import { Job, JobType, Queue } from 'bullmq';
import {
  ReleaseErrorCode,
  ReleaseModel,
  ReleaseState,
  RetryableReleaseErrorCodes,
} from '@openupm/types';
import { fetchRecentReleases } from '@openupm/server-common/build/models/release.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

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
  source: 'git' | 'githubRelease';
  signed: boolean;
  retryable?: boolean;
}

export interface PublicQueueStatus {
  generatedAt: string;
  cache: {
    state: 'fresh' | 'stale';
    ttlSeconds: number;
  };
  summary: {
    state: 'healthy' | 'backlog' | 'degraded';
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

interface QueueLike {
  getJobCounts: (...types: JobType[]) => Promise<Record<string, number>>;
  getWorkers: () => Promise<unknown[]>;
  getJobs: (
    types: JobType[] | JobType,
    start?: number,
    end?: number,
    asc?: boolean,
  ) => Promise<Array<Job | QueueJobLike>>;
}

interface QueueJobLike {
  id?: string | number;
  name: string;
  data: unknown;
  attemptsMade: number;
  opts?: { attempts?: number };
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  getState: () => Promise<string>;
}

export interface QueueStatusSources {
  packageQueue: QueueLike;
  releaseQueue: QueueLike;
  getRecentSuccessfulReleases?: (limit: number) => Promise<ReleaseModel[]>;
  getRecentFailedReleases?: (limit: number) => Promise<ReleaseModel[]>;
  now?: () => number;
}

export interface QueueStatusOptions {
  cacheState?: 'fresh' | 'stale';
  ttlSeconds?: number;
  jobLimit?: number;
  releaseLimit?: number;
}

interface CachedStatus {
  generatedAtMs: number;
  value: PublicQueueStatus;
}

const DEFAULT_TTL_SECONDS = 15;
const DEFAULT_JOB_LIMIT = 20;
const DEFAULT_RELEASE_LIMIT = 20;

const queues: Record<string, Queue> = {};

function enumName<T extends Record<string, string | number>>(
  obj: T,
  value: number,
): string {
  return (obj[value as keyof T] as string | undefined) ?? `${value}`;
}

function toIso(value?: number): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function truncateError(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const firstLine = value.split(/\r?\n/, 1)[0].trim();
  if (firstLine.length <= 160) return firstLine;
  return `${firstLine.slice(0, 157)}...`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringField(value: unknown, keys: string[]): string | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    const field = value[key];
    if (typeof field === 'string' && field.length > 0) return field;
  }
  return undefined;
}

export function parseReleaseJobIdentity(
  job: Pick<QueueJobLike, 'id' | 'data'>,
): {
  packageName: string;
  version: string;
} {
  const dataPackage = getStringField(job.data, ['packageName', 'package']);
  const dataVersion = getStringField(job.data, ['version', 'packageVersion']);
  if (dataPackage && dataVersion) {
    return { packageName: dataPackage, version: dataVersion };
  }

  const parts = `${job.id ?? ''}`.split('|').map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
  return {
    packageName: parts[1] || '',
    version: parts[2] || '',
  };
}

function parsePackageJobName(job: Pick<QueueJobLike, 'id' | 'data'>): string {
  const dataPackage = getStringField(job.data, ['packageName', 'package']);
  if (dataPackage) return dataPackage;
  const parts = `${job.id ?? ''}`.split('|').map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
  return parts[1] || `${job.id ?? ''}`;
}

async function summarizeJob(
  job: Job | QueueJobLike,
  type: 'package' | 'release',
): Promise<PublicQueueJobSummary> {
  const state = await job.getState();
  const release = type === 'release' ? parseReleaseJobIdentity(job) : null;
  return {
    package: release?.packageName || parsePackageJobName(job),
    version: release?.version,
    state,
    timestamp: toIso(job.timestamp),
    processedAt: toIso(job.processedOn),
    finishedAt: toIso(job.finishedOn),
    attempts: job.attemptsMade,
    maxAttempts: job.opts?.attempts ?? 1,
    error: truncateError(job.failedReason),
  };
}

function countValue(counts: Record<string, number>, key: string): number {
  return Number(counts[key] || 0);
}

async function getLimitedJobs(
  queue: QueueLike,
  types: JobType[],
  limit: number,
  sortByOldest = false,
): Promise<Array<Job | QueueJobLike>> {
  if (limit < 1) return [];
  const jobs = await queue.getJobs(types, 0, limit - 1, sortByOldest);
  return jobs;
}

function summarizeRelease(
  release: ReleaseModel,
  includeRetryable: boolean,
): PublicReleaseSummary {
  const summary: PublicReleaseSummary = {
    package: release.packageName,
    version: release.version,
    state: enumName(ReleaseState, release.state),
    reason: enumName(ReleaseErrorCode, release.reason),
    updatedAt: new Date(release.updatedAt).toISOString(),
    buildId: release.buildId || undefined,
    source: release.source || 'git',
    signed: release.signed === true,
  };
  if (includeRetryable) {
    summary.retryable = RetryableReleaseErrorCodes.includes(release.reason);
  }
  return summary;
}

function getSummary(params: {
  packageFailed: number;
  releaseWaiting: number;
  releaseFailed: number;
  oldestWaitingMs: number | null;
}): PublicQueueStatus['summary'] {
  const oneHourMs = 60 * 60 * 1000;
  if (params.packageFailed > 0 || params.releaseFailed > 0) {
    return {
      state: 'degraded',
      message: 'Some queue jobs are retained as failed and need attention.',
    };
  }
  if (
    params.releaseWaiting > 100 ||
    (params.oldestWaitingMs !== null && params.oldestWaitingMs > oneHourMs)
  ) {
    return {
      state: 'backlog',
      message: 'Release builds are queued and waiting for available workers.',
    };
  }
  return {
    state: 'healthy',
    message: 'Package scans and release builds are processing normally.',
  };
}

export async function buildPublicQueueStatus(
  sources: QueueStatusSources,
  options: QueueStatusOptions = {},
): Promise<PublicQueueStatus> {
  const now = sources.now?.() ?? Date.now();
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const jobLimit = options.jobLimit ?? DEFAULT_JOB_LIMIT;
  const releaseLimit = options.releaseLimit ?? DEFAULT_RELEASE_LIMIT;
  const [packageCounts, packageWorkers, releaseCounts, releaseWorkers] =
    await Promise.all([
      sources.packageQueue.getJobCounts('active', 'failed'),
      sources.packageQueue.getWorkers(),
      sources.releaseQueue.getJobCounts(
        'waiting',
        'active',
        'delayed',
        'failed',
      ),
      sources.releaseQueue.getWorkers(),
    ]);

  const [
    failedPackageJobs,
    activeReleaseJobs,
    waitingReleaseJobs,
    failedReleaseJobs,
    recentSuccessfulReleases,
    recentFailedReleases,
  ] = await Promise.all([
    getLimitedJobs(sources.packageQueue, ['failed'], jobLimit),
    getLimitedJobs(sources.releaseQueue, ['active'], jobLimit),
    getLimitedJobs(sources.releaseQueue, ['waiting'], jobLimit, true),
    getLimitedJobs(sources.releaseQueue, ['failed'], jobLimit),
    (
      sources.getRecentSuccessfulReleases ??
      ((limit: number): Promise<ReleaseModel[]> =>
        fetchRecentReleases('succeeded', limit))
    )(releaseLimit),
    (
      sources.getRecentFailedReleases ??
      ((limit: number): Promise<ReleaseModel[]> =>
        fetchRecentReleases('failed', limit))
    )(releaseLimit),
  ]);

  const waitingSummaries = await Promise.all(
    waitingReleaseJobs.map(async (job) => await summarizeJob(job, 'release')),
  );
  const oldestWaitingMs = waitingReleaseJobs.length
    ? Math.max(
        0,
        now - Math.min(...waitingReleaseJobs.map((job) => job.timestamp)),
      )
    : null;
  const packageFailed = countValue(packageCounts, 'failed');
  const releaseFailed = countValue(releaseCounts, 'failed');
  const releaseWaiting = countValue(releaseCounts, 'waiting');

  return {
    generatedAt: new Date(now).toISOString(),
    cache: {
      state: options.cacheState ?? 'fresh',
      ttlSeconds,
    },
    summary: getSummary({
      packageFailed,
      releaseWaiting,
      releaseFailed,
      oldestWaitingMs,
    }),
    packageQueue: {
      active: countValue(packageCounts, 'active'),
      failed: packageFailed,
      workers: packageWorkers.length,
      failedJobs: await Promise.all(
        failedPackageJobs.map(
          async (job) => await summarizeJob(job, 'package'),
        ),
      ),
    },
    releaseQueue: {
      waiting: releaseWaiting,
      active: countValue(releaseCounts, 'active'),
      delayed: countValue(releaseCounts, 'delayed'),
      failed: releaseFailed,
      workers: releaseWorkers.length,
      oldestWaitingMs,
      activeJobs: await Promise.all(
        activeReleaseJobs.map(
          async (job) => await summarizeJob(job, 'release'),
        ),
      ),
      waitingJobs: waitingSummaries,
    },
    recentSuccessfulReleases: recentSuccessfulReleases
      .slice(0, releaseLimit)
      .map((release) => summarizeRelease(release, false)),
    recentFailedReleases: recentFailedReleases
      .slice(0, releaseLimit)
      .map((release) => summarizeRelease(release, true)),
    retainedFailedReleaseJobs: await Promise.all(
      failedReleaseJobs.map(async (job) => await summarizeJob(job, 'release')),
    ),
  };
}

export function getQueue(name: string): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      ...config.queueSettings[name],
      connection: config.redis,
    });
  }
  return queues[name];
}

export async function closeQueueStatusQueues(): Promise<void> {
  await Promise.all(
    Object.values(queues).map(async (queue) => await queue.close()),
  );
  for (const name of Object.keys(queues)) delete queues[name];
}

export function createQueueStatusCache(
  refresh: (cacheState: 'fresh') => Promise<PublicQueueStatus>,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  now: () => number = (): number => Date.now(),
): { get: () => Promise<PublicQueueStatus>; clear: () => void } {
  let cached: CachedStatus | null = null;
  let refreshPromise: Promise<CachedStatus> | null = null;

  async function runRefresh(): Promise<CachedStatus> {
    const value = await refresh('fresh');
    const next = { generatedAtMs: now(), value };
    cached = next;
    return next;
  }

  return {
    async get(): Promise<PublicQueueStatus> {
      if (cached && now() - cached.generatedAtMs < ttlSeconds * 1000) {
        return {
          ...cached.value,
          cache: { ...cached.value.cache, state: 'fresh', ttlSeconds },
        };
      }

      if (!refreshPromise) {
        refreshPromise = runRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const next = await refreshPromise;
        return {
          ...next.value,
          cache: { ...next.value.cache, state: 'fresh', ttlSeconds },
        };
      } catch (error) {
        if (cached) {
          return {
            ...cached.value,
            cache: { ...cached.value.cache, state: 'stale', ttlSeconds },
          };
        }
        throw error;
      }
    },
    clear(): void {
      cached = null;
      refreshPromise = null;
    },
  };
}
