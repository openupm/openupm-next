import {
  DailyDownload,
  PackageMetadataLocal,
  PublicTrends,
  ReleaseModel,
  TopicBase,
  TrendsPoint,
  TrendsSeries,
} from '@openupm/types';
import { ReleaseState } from '@openupm/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PackageDownloadRange {
  package: string;
  downloads: DailyDownload[];
}

function toTimestampMs(value: number): number {
  return value < 100_000_000_000 ? value * 1000 : value;
}

function toUtcDay(value: number): string {
  return new Date(toTimestampMs(value)).toISOString().substring(0, 10);
}

function toUtcMonth(day: string): string {
  return day.substring(0, 7);
}

function toMonthStart(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function addMonths(month: string, months: number): string {
  const date = toMonthStart(month);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().substring(0, 7);
}

function parseDay(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

function addDays(day: string, days: number): string {
  return toUtcDay(parseDay(day) + days * DAY_MS);
}

function compareDate(a: string, b: string): number {
  return a.localeCompare(b);
}

function minDefinedDate(values: string[]): string | null {
  const filtered = values.filter(Boolean).sort(compareDate);
  return filtered.length ? filtered[0] : null;
}

function maxDefinedDate(values: string[]): string | null {
  const filtered = values.filter(Boolean).sort(compareDate);
  return filtered.length ? filtered[filtered.length - 1] : null;
}

function buildCountByDay(days: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const day of days) counts.set(day, (counts.get(day) || 0) + 1);
  return counts;
}

function buildCumulativePoints(
  countsByDay: Map<string, number>,
  startDay: string | null,
  endDay: string | null,
): TrendsPoint[] {
  if (!startDay || !endDay) return [];
  const points: TrendsPoint[] = [];
  let total = 0;
  for (let day = startDay; day <= endDay; day = addDays(day, 1)) {
    total += countsByDay.get(day) || 0;
    points.push({ date: day, value: total });
  }
  return points;
}

function sampleMonthly(points: TrendsPoint[]): TrendsPoint[] {
  const byMonth = new Map<string, TrendsPoint>();
  for (const point of points) byMonth.set(toUtcMonth(point.date), point);
  const sampled = Array.from(byMonth.entries())
    .sort(([a], [b]) => compareDate(a, b))
    .map(([date, point]) => ({ date, value: point.value }));
  return fillMonthlyPoints(sampled, 'carry');
}

function buildMonthlyCounts(days: string[]): TrendsPoint[] {
  const counts = new Map<string, number>();
  for (const day of days) {
    const month = toUtcMonth(day);
    counts.set(month, (counts.get(month) || 0) + 1);
  }
  const points = Array.from(counts.entries())
    .sort(([a], [b]) => compareDate(a, b))
    .map(([date, value]) => ({ date, value }));
  return fillMonthlyPoints(points, 'zero');
}

function fillMonthlyPoints(
  points: TrendsPoint[],
  mode: 'zero' | 'carry',
): TrendsPoint[] {
  if (points.length === 0) return [];
  const values = new Map(points.map((point) => [point.date, point.value]));
  const startMonth = points[0].date;
  const endMonth = points[points.length - 1].date;
  const filled: TrendsPoint[] = [];
  let carriedValue = 0;
  for (let month = startMonth; month <= endMonth; month = addMonths(month, 1)) {
    if (values.has(month)) carriedValue = values.get(month) as number;
    filled.push({
      date: month,
      value: mode === 'carry' ? carriedValue : values.get(month) || 0,
    });
  }
  return filled;
}

function sumDownloadsByDay(
  ranges: PackageDownloadRange[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const range of ranges) {
    for (const entry of range.downloads) {
      counts.set(entry.day, (counts.get(entry.day) || 0) + entry.downloads);
    }
  }
  return counts;
}

function mapToSortedPoints(counts: Map<string, number>): TrendsPoint[] {
  return Array.from(counts.entries())
    .sort(([a], [b]) => compareDate(a, b))
    .map(([date, value]) => ({ date, value }));
}

function buildDownloadMonthPoints(
  downloadsByDay: Map<string, number>,
): TrendsPoint[] {
  const counts = new Map<string, number>();
  for (const [day, downloads] of downloadsByDay) {
    const month = toUtcMonth(day);
    counts.set(month, (counts.get(month) || 0) + downloads);
  }
  return fillMonthlyPoints(mapToSortedPoints(counts), 'zero');
}

function buildTopicSeries(
  topics: TopicBase[],
  packages: PackageMetadataLocal[],
  startDay: string | null,
  endDay: string | null,
): TrendsSeries[] {
  return topics.map((topic) => {
    const packageDays = packages
      .filter((pkg) => pkg.topics.includes(topic.slug))
      .map((pkg) => toUtcDay(pkg.createdAt));
    return {
      key: topic.slug,
      label: topic.name,
      points: sampleMonthly(
        buildCumulativePoints(buildCountByDay(packageDays), startDay, endDay),
      ),
    };
  });
}

function getReleaseDay(release: ReleaseModel): string {
  return toUtcDay(release.createdAt || release.updatedAt);
}

function buildSignedPackageDays(releases: ReleaseModel[]): string[] {
  const firstSignedDayByPackage = new Map<string, string>();
  for (const release of releases) {
    if (release.signed !== true) continue;
    const day = getReleaseDay(release);
    const existing = firstSignedDayByPackage.get(release.packageName);
    if (!existing || day < existing) {
      firstSignedDayByPackage.set(release.packageName, day);
    }
  }
  return Array.from(firstSignedDayByPackage.values());
}

function buildActivePackageDays(releases: ReleaseModel[]): string[] {
  const firstReleaseDayByPackage = new Map<string, string>();
  for (const release of releases) {
    if (release.state !== ReleaseState.Succeeded) continue;
    const day = getReleaseDay(release);
    const existing = firstReleaseDayByPackage.get(release.packageName);
    if (!existing || day < existing) {
      firstReleaseDayByPackage.set(release.packageName, day);
    }
  }
  return Array.from(firstReleaseDayByPackage.values());
}

function buildReleaseSourceSeries(
  packages: PackageMetadataLocal[],
  startDay: string | null,
  endDay: string | null,
): TrendsSeries[] {
  const gitDays = packages
    .filter((pkg) => (pkg.trackingMode || 'git') === 'git')
    .map((pkg) => toUtcDay(pkg.createdAt));
  const githubReleaseDays = packages
    .filter((pkg) => pkg.trackingMode === 'githubRelease')
    .map((pkg) => toUtcDay(pkg.createdAt));
  return [
    {
      key: 'githubReleaseAssets',
      label: 'GitHub Release asset packages',
      points: sampleMonthly(
        buildCumulativePoints(
          buildCountByDay(githubReleaseDays),
          startDay,
          endDay,
        ),
      ),
    },
    {
      key: 'gitSource',
      label: 'Git source packages',
      points: sampleMonthly(
        buildCumulativePoints(buildCountByDay(gitDays), startDay, endDay),
      ),
    },
  ];
}

function buildReleaseMonthPoints(releases: ReleaseModel[]): TrendsPoint[] {
  return buildMonthlyCounts(
    releases
      .filter((release) => release.state === ReleaseState.Succeeded)
      .map(getReleaseDay),
  );
}

function buildSucceededReleaseDays(releases: ReleaseModel[]): string[] {
  return releases
    .filter((release) => release.state === ReleaseState.Succeeded)
    .map(getReleaseDay);
}

function countActivePackagesLast12Months(
  releases: ReleaseModel[],
  generatedAt: Date,
): number {
  const cutoff = new Date(generatedAt);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const packages = new Set<string>();
  for (const release of releases) {
    if (release.state !== ReleaseState.Succeeded) continue;
    const releaseTime = release.createdAt || release.updatedAt;
    if (releaseTime >= cutoff.getTime()) packages.add(release.packageName);
  }
  return packages.size;
}

export function buildPublicTrends(input: {
  generatedAt?: Date;
  packages: PackageMetadataLocal[];
  topics: TopicBase[];
  releases: ReleaseModel[];
  downloadRanges: PackageDownloadRange[];
}): PublicTrends {
  const generatedAt = input.generatedAt || new Date();
  const packageDays = input.packages.map((pkg) => toUtcDay(pkg.createdAt));
  const firstPackageDay = minDefinedDate(packageDays);
  const lastPackageDay = maxDefinedDate(packageDays);
  const signedPackageDays = buildSignedPackageDays(input.releases);
  const activePackageDays = buildActivePackageDays(input.releases);
  const signedPackagesByDay = sampleMonthly(
    buildCumulativePoints(
      buildCountByDay(signedPackageDays),
      minDefinedDate([...packageDays, ...signedPackageDays]),
      maxDefinedDate([...packageDays, ...signedPackageDays]),
    ),
  );
  const downloadsByDay = sumDownloadsByDay(input.downloadRanges);
  const downloadDays = Array.from(downloadsByDay.keys());
  const firstDownloadDay = minDefinedDate(downloadDays);
  const lastDownloadDay = maxDefinedDate(downloadDays);
  const succeededReleaseDays = buildSucceededReleaseDays(input.releases);
  const firstReleaseDay = minDefinedDate(succeededReleaseDays);
  const lastReleaseDay = maxDefinedDate(succeededReleaseDays);

  return {
    generatedAt: generatedAt.toISOString(),
    coverage: {
      catalogGrowth: {
        state: 'exact',
        source: 'package metadata',
        description:
          'Package submission history is backfilled from package metadata createdAt fields.',
        start: firstPackageDay || undefined,
        end: lastPackageDay || undefined,
      },
      topicGrowth: {
        state: 'estimated',
        source: 'package metadata',
        description:
          'Topic history projects each package current topics back to its package submission date.',
        start: firstPackageDay || undefined,
        end: lastPackageDay || undefined,
      },
      trustAndDistribution: {
        state: 'partial',
        source: 'release records and package metadata',
        description:
          'Signed package counts use release records with signing metadata; older records may be unknown.',
      },
      downloads: {
        state: 'exact',
        source: 'daily package download history',
        description:
          'Download charts are calculated from per-package daily download history.',
        start: firstDownloadDay || undefined,
        end: lastDownloadDay || undefined,
      },
    },
    catalogGrowth: {
      totalPackageSubmissionsByDay: sampleMonthly(
        buildCumulativePoints(
          buildCountByDay(packageDays),
          firstPackageDay,
          lastPackageDay,
        ),
      ),
      newPackageSubmissionsByMonth: buildMonthlyCounts(packageDays),
      totalActivePackagesByDay: sampleMonthly(
        buildCumulativePoints(
          buildCountByDay(activePackageDays),
          minDefinedDate([...packageDays, ...activePackageDays]),
          maxDefinedDate([...packageDays, ...activePackageDays]),
        ),
      ),
      packageSubmissionsByTopicByDay: buildTopicSeries(
        input.topics,
        input.packages,
        firstPackageDay,
        lastPackageDay,
      ),
    },
    trustAndDistribution: {
      signedPackagesByDay,
      releaseSourceAndSigningByDay: buildReleaseSourceSeries(
        input.packages,
        firstPackageDay,
        lastPackageDay,
      ),
    },
    releaseActivity: {
      activePackagesLast12Months: countActivePackagesLast12Months(
        input.releases,
        generatedAt,
      ),
      totalReleasesByTime: sampleMonthly(
        buildCumulativePoints(
          buildCountByDay(succeededReleaseDays),
          firstReleaseDay,
          lastReleaseDay,
        ),
      ),
      releasesPerMonth: buildReleaseMonthPoints(input.releases),
    },
    downloads: {
      totalDownloadsByTime: sampleMonthly(
        buildCumulativePoints(
          downloadsByDay,
          firstDownloadDay,
          lastDownloadDay,
        ),
      ),
      downloadsPerMonth: buildDownloadMonthPoints(downloadsByDay),
    },
  };
}
