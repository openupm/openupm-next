import configRaw from 'config';
import {
  DailyDownload,
  DownloadsRange,
  Packument,
  ReleaseModel,
  ReleaseState,
} from '@openupm/types';
import {
  loadPackageMetadataLocal,
  loadPackageNames,
  loadTopics,
} from '@openupm/local-data';
import {
  getDownloadsRangeUrl,
  getPackumentUrl,
} from '@openupm/common/build/urls.js';
import { createLogger } from '@openupm/server-common/build/log.js';
import { fetchAll } from '@openupm/server-common/build/models/release.js';
import { setPublicTrends } from '@openupm/server-common/build/models/trends.js';
import {
  buildPublicTrends,
  PackageDownloadRange,
} from '@openupm/server-common/build/trends/aggregation.js';
import { openTrendsSqliteStore } from '@openupm/server-common/build/trends/sqliteStore.js';

const logger = createLogger('@openupm/jobs/buildTrendsSnapshot');
const DOWNLOAD_FETCH_CONCURRENCY = 8;
const DEFAULT_RECENT_REFRESH_LOOKBACK_DAYS = 14;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

export type TrendsSnapshotMode = 'full' | 'recent';

export interface BuildTrendsSnapshotOptions {
  mode?: TrendsSnapshotMode;
  recentRefreshLookbackDays?: number;
}

function toTimestampMs(value: number): number {
  return value < 100_000_000_000 ? value * 1000 : value;
}

function toUtcDay(value: number): string {
  return new Date(toTimestampMs(value)).toISOString().substring(0, 10);
}

function parseUtcDay(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

function addDays(day: string, days: number): string {
  return toUtcDay(parseUtcDay(day) + days * 24 * 60 * 60 * 1000);
}

function maxDay(a: string, b: string): string {
  return a > b ? a : b;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < values.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(values[currentIndex]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    method: 'GET',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`request failed ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

function normalizeDownloads(downloads: DailyDownload[]): DailyDownload[] {
  return downloads
    .filter(
      (entry) =>
        typeof entry.day === 'string' &&
        Number.isFinite(entry.downloads) &&
        entry.downloads > 0,
    )
    .map((entry) => ({
      day: entry.day,
      downloads: Math.trunc(entry.downloads),
    }));
}

function packumentReleaseEntries(packument: Packument): Array<{
  version: string;
  time: number;
}> {
  return Object.entries(packument.time || {})
    .filter(([version]) => version !== 'created' && version !== 'modified')
    .map(([version, time]) => ({
      version,
      time: Date.parse(time),
    }))
    .filter((entry) => Number.isFinite(entry.time));
}

async function fetchPublishedReleases(
  packageName: string,
): Promise<ReleaseModel[]> {
  try {
    const packument = await fetchJson<Packument>(getPackumentUrl(packageName));
    return packumentReleaseEntries(packument).map(({ version, time }) => ({
      packageName,
      version,
      commit: '',
      tag: version,
      state: ReleaseState.Succeeded,
      buildId: '',
      reason: 0,
      createdAt: time,
      updatedAt: time,
    }));
  } catch (err) {
    logger.warn({ err, packageName }, 'fetch package packument failed');
    return [];
  }
}

function mergeReleaseRecords(
  redisReleases: ReleaseModel[],
  publishedReleases: ReleaseModel[],
): ReleaseModel[] {
  const merged = new Map<string, ReleaseModel>();
  for (const release of publishedReleases) {
    merged.set(`${release.packageName}@${release.version}`, release);
  }
  for (const release of redisReleases) {
    const key = `${release.packageName}@${release.version}`;
    const publishedRelease = merged.get(key);
    merged.set(
      key,
      publishedRelease?.state === ReleaseState.Succeeded &&
        release.state !== ReleaseState.Succeeded
        ? {
            ...release,
            state: ReleaseState.Succeeded,
            createdAt: publishedRelease.createdAt,
            updatedAt: publishedRelease.updatedAt,
          }
        : release,
    );
  }
  return Array.from(merged.values());
}

async function fetchPackageDownloadRange(
  packageName: string,
  period: string,
): Promise<PackageDownloadRange> {
  try {
    const data = await fetchJson<DownloadsRange>(
      getDownloadsRangeUrl(packageName, period),
    );
    return {
      package: packageName,
      downloads: normalizeDownloads(data.downloads || []),
    };
  } catch (err) {
    logger.warn({ err, packageName }, 'fetch package download history failed');
    return { package: packageName, downloads: [] };
  }
}

function getRecentRefreshLookbackDays(
  options: BuildTrendsSnapshotOptions,
): number {
  const value =
    options.recentRefreshLookbackDays ??
    config.trends?.recentRefreshLookbackDays ??
    DEFAULT_RECENT_REFRESH_LOOKBACK_DAYS;
  return Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : DEFAULT_RECENT_REFRESH_LOOKBACK_DAYS;
}

function getDownloadStartDay(params: {
  firstPackageDay: string;
  mode: TrendsSnapshotMode;
  options: BuildTrendsSnapshotOptions;
  today: string;
}): string {
  if (params.mode === 'full') return params.firstPackageDay;
  const lookbackDays = getRecentRefreshLookbackDays(params.options);
  return maxDay(params.firstPackageDay, addDays(params.today, -lookbackDays));
}

export async function buildTrendsSnapshotJob(
  options: BuildTrendsSnapshotOptions = {},
): Promise<void> {
  const mode = options.mode || 'recent';
  const packageNames = await loadPackageNames();
  const topics = await loadTopics();
  const packages = (
    await Promise.all(
      packageNames.map(async (packageName) => {
        const pkg = await loadPackageMetadataLocal(packageName);
        if (!pkg) {
          logger.warn({ packageName }, 'package metadata local does not exist');
        }
        return pkg;
      }),
    )
  ).filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);

  const redisReleases = (
    await Promise.all(
      packages.map(async (pkg): Promise<ReleaseModel[]> => {
        try {
          return await fetchAll(pkg.name);
        } catch (err) {
          logger.warn({ err, packageName: pkg.name }, 'fetch releases failed');
          return [];
        }
      }),
    )
  ).flat();
  const publishedReleases = (
    await mapWithConcurrency(
      packages.map((pkg) => pkg.name),
      DOWNLOAD_FETCH_CONCURRENCY,
      fetchPublishedReleases,
    )
  ).flat();
  const releases = mergeReleaseRecords(redisReleases, publishedReleases);

  const firstPackageDay = packages.length
    ? packages
        .map((pkg) => toUtcDay(pkg.createdAt))
        .sort((a, b) => a.localeCompare(b))[0]
    : toUtcDay(Date.now());
  const today = toUtcDay(Date.now());
  const store = openTrendsSqliteStore(config.trends.sqlitePath);
  let downloadRanges: PackageDownloadRange[];
  let fullDownloadBackfillPackages = 0;
  try {
    const packageNamesForDownloads = packages.map((pkg) => pkg.name);
    const packageNamesMissingDownloads =
      mode === 'recent'
        ? new Set(
            store.getPackageNamesWithoutDownloads(packageNamesForDownloads),
          )
        : new Set(packageNamesForDownloads);
    fullDownloadBackfillPackages = packageNamesMissingDownloads.size;
    const recentDownloadStartDay = getDownloadStartDay({
      firstPackageDay,
      mode: 'recent',
      options,
      today,
    });
    const fetchedDownloadRanges = await mapWithConcurrency(
      packageNamesForDownloads,
      DOWNLOAD_FETCH_CONCURRENCY,
      (packageName) =>
        fetchPackageDownloadRange(
          packageName,
          `${
            packageNamesMissingDownloads.has(packageName)
              ? firstPackageDay
              : recentDownloadStartDay
          }:${today}`,
        ),
    );
    for (const range of fetchedDownloadRanges) {
      store.upsertPackageDownloads(range.package, range.downloads);
    }
    downloadRanges = store.getPackageDownloadRanges(
      packages.map((pkg) => pkg.name),
    );
  } finally {
    store.close();
  }

  const trends = buildPublicTrends({
    packages,
    topics,
    releases,
    downloadRanges,
  });
  await setPublicTrends(trends);
  logger.info(
    {
      packages: packages.length,
      releases: releases.length,
      downloadRanges: downloadRanges.length,
      fullDownloadBackfillPackages,
      generatedAt: trends.generatedAt,
      mode,
    },
    'trends snapshot updated',
  );
}

export async function buildTrendsSnapshotBackfillJob(): Promise<void> {
  await buildTrendsSnapshotJob({ mode: 'full' });
}
