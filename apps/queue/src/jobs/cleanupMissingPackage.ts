import configRaw from 'config';
import type { Job, JobType } from 'bullmq';

import { ReleaseState } from '@openupm/types';
import { packageMetadataLocalExists } from '@openupm/local-data';
import {
  fetchAll,
  remove as removeReleaseRecord,
} from '@openupm/server-common/build/models/release.js';
import { createLogger } from '@openupm/server-common/build/log.js';

import { getQueue } from '../queues/core.js';
import { createJobId } from '../queues/jobId.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/queue/cleanupMissingPackage');

export interface CleanupMissingPackageResult {
  packageName: string;
  metadataMissing: boolean;
  packageJob: {
    queue: string;
    jobId: string;
    removed: boolean;
    removeError?: string;
  };
  failedReleasesRemoved: Array<{
    packageName: string;
    version: string;
    jobId: string;
    jobRemoved: boolean;
  }>;
  preservedReleaseCount: number;
}

export interface CleanupMissingPackageJobsResult {
  queue: string;
  states: JobType[];
  scanned: number;
  cleaned: CleanupMissingPackageResult[];
  skipped: string[];
}

export function getBuildPackageJobId(packageName: string): string {
  const jobConfig = config.jobs.buildPackage;
  return createJobId(jobConfig.name, packageName);
}

export function getBuildReleaseJobId(
  packageName: string,
  version: string,
): string {
  const jobConfig = config.jobs.buildRelease;
  return createJobId(jobConfig.name, packageName, version);
}

export function getPackageNameFromBuildPackageJob(
  job: Pick<Job, 'id' | 'data'>,
): string | null {
  const data = job.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).name === 'string'
  ) {
    return (data as Record<string, string>).name;
  }

  if (typeof job.id !== 'string') return null;
  const parts = job.id.split('|');
  const expectedName = encodeURIComponent(config.jobs.buildPackage.name);
  if (parts.length !== 2 || parts[0] !== expectedName) return null;

  try {
    return decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
}

async function removeQueueJob(
  queueName: string,
  jobId: string,
): Promise<{ removed: boolean; removeError?: string }> {
  try {
    const removed = await getQueue(queueName).remove(jobId, {
      removeChildren: true,
    });
    return { removed: removed === 1 };
  } catch (error) {
    const removeError = (error as Error).message || String(error);
    logger.warn({ queueName, jobId, err: error }, 'queue job remove failed');
    return { removed: false, removeError };
  }
}

export async function cleanupMissingPackage(
  packageName: string,
): Promise<CleanupMissingPackageResult> {
  const packageJobConfig = config.jobs.buildPackage;
  const releaseJobConfig = config.jobs.buildRelease;
  const packageJobId = getBuildPackageJobId(packageName);
  const metadataMissing = !packageMetadataLocalExists(packageName);
  const packageJob = {
    queue: packageJobConfig.queue,
    jobId: packageJobId,
    removed: false,
  };

  if (!metadataMissing) {
    return {
      packageName,
      metadataMissing: false,
      packageJob,
      failedReleasesRemoved: [],
      preservedReleaseCount: 0,
    };
  }

  Object.assign(
    packageJob,
    await removeQueueJob(packageJobConfig.queue, packageJobId),
  );

  const releases = await fetchAll(packageName);
  const failedReleasesRemoved: CleanupMissingPackageResult['failedReleasesRemoved'] =
    [];
  let preservedReleaseCount = 0;

  for (const release of releases) {
    if (release.state !== ReleaseState.Failed) {
      preservedReleaseCount++;
      continue;
    }

    const jobId = getBuildReleaseJobId(packageName, release.version);
    const job = await removeQueueJob(releaseJobConfig.queue, jobId);
    await removeReleaseRecord(packageName, release.version);
    failedReleasesRemoved.push({
      packageName,
      version: release.version,
      jobId,
      jobRemoved: job.removed,
    });
  }

  logger.info(
    {
      packageName,
      packageJob,
      failedReleaseCount: failedReleasesRemoved.length,
      preservedReleaseCount,
    },
    'cleaned missing package queue state',
  );

  return {
    packageName,
    metadataMissing: true,
    packageJob,
    failedReleasesRemoved,
    preservedReleaseCount,
  };
}

export async function cleanupMissingPackageJobs(): Promise<CleanupMissingPackageJobsResult> {
  const jobConfig = config.jobs.buildPackage;
  const queue = getQueue(jobConfig.queue);
  const states: JobType[] = ['failed'];
  const counts = await queue.getJobCounts(...states);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const jobs =
    total === 0 ? [] : await queue.getJobs(states, 0, total - 1, false);
  const cleaned: CleanupMissingPackageResult[] = [];
  const skipped: string[] = [];

  for (const job of jobs) {
    const packageName = getPackageNameFromBuildPackageJob(job as Job);
    if (!packageName) {
      skipped.push(`${job.id ?? ''}`);
      continue;
    }
    if (packageMetadataLocalExists(packageName)) {
      skipped.push(packageName);
      continue;
    }
    cleaned.push(await cleanupMissingPackage(packageName));
  }

  return {
    queue: jobConfig.queue,
    states,
    scanned: jobs.length,
    cleaned,
    skipped,
  };
}
