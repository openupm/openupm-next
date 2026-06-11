import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReleaseState } from '@openupm/types';

const loadPackageNamesMock = vi.fn();
const loadPackageMetadataLocalMock = vi.fn();
const loadTopicsMock = vi.fn();
const fetchAllMock = vi.fn();
const setPublicTrendsMock = vi.fn();
const openTrendsSqliteStoreMock = vi.fn();
const getPackageNamesWithoutDownloadsMock = vi.fn();
const upsertPackageDownloadsMock = vi.fn();
const getPackageDownloadRangesMock = vi.fn();
const closeMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
  loadTopics: loadTopicsMock,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  fetchAll: fetchAllMock,
}));

vi.mock('@openupm/server-common/build/models/trends.js', () => ({
  setPublicTrends: setPublicTrendsMock,
}));

vi.mock('@openupm/server-common/build/trends/sqliteStore.js', () => ({
  openTrendsSqliteStore: openTrendsSqliteStoreMock,
}));

describe('buildTrendsSnapshotJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T00:00:00.000Z'));
    openTrendsSqliteStoreMock.mockReturnValue({
      getPackageNamesWithoutDownloads: getPackageNamesWithoutDownloadsMock,
      upsertPackageDownloads: upsertPackageDownloadsMock,
      getPackageDownloadRanges: getPackageDownloadRangesMock,
      close: closeMock,
    });
    getPackageNamesWithoutDownloadsMock.mockReturnValue([]);
    getPackageDownloadRangesMock.mockReturnValue([
      {
        package: 'com.example.pkg',
        downloads: [
          { day: '2026-01-02', downloads: 7 },
          { day: '2026-06-10', downloads: 5 },
        ],
      },
    ]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes('/downloads/range/')
            ? {
                package: 'com.example.pkg',
                downloads: [{ day: '2026-06-10', downloads: 5 }],
              }
            : {
                name: 'com.example.pkg',
                versions: {},
                time: {
                  created: '2026-01-01T00:00:00.000Z',
                  modified: '2026-03-05T00:00:00.000Z',
                  '1.0.0': '2026-01-03T00:00:00.000Z',
                  '1.1.0': '2026-03-05T00:00:00.000Z',
                },
                'dist-tags': {},
                readme: '',
              },
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function mockPackageMetadata(): void {
    loadPackageNamesMock.mockResolvedValue(['com.example.pkg']);
    loadTopicsMock.mockResolvedValue([
      { slug: 'tools', name: 'Tools', keywords: [] },
    ]);
    loadPackageMetadataLocalMock.mockResolvedValue({
      name: 'com.example.pkg',
      aliases: [],
      repoUrl: 'https://github.com/example/pkg',
      displayName: 'Pkg',
      description: '',
      licenseSpdxId: null,
      licenseName: '',
      topics: ['tools'],
      hunter: '',
      createdAt: Date.parse('2026-01-01T00:00:00.000Z') / 1000,
      trackingMode: 'githubRelease',
      repo: 'pkg',
      owner: 'example',
      ownerUrl: '',
      parentRepo: null,
      parentOwner: null,
      parentOwnerUrl: null,
      readmeBranch: 'main',
      hunterUrl: null,
    });
  }

  function mockReleases(): void {
    fetchAllMock.mockResolvedValue([
      {
        packageName: 'com.example.pkg',
        version: '1.0.0',
        commit: '',
        tag: '',
        state: ReleaseState.Succeeded,
        buildId: '',
        reason: 0,
        createdAt: Date.parse('2026-01-03T00:00:00.000Z'),
        updatedAt: Date.parse('2026-01-03T00:00:00.000Z'),
        source: 'githubRelease',
        signed: true,
      },
    ]);
  }

  it('refreshes recent download history and saves a public trends snapshot', async () => {
    mockPackageMetadata();
    mockReleases();

    const { buildTrendsSnapshotJob } = await import(
      '../../src/jobs/buildTrendsSnapshot.js'
    );
    await buildTrendsSnapshotJob();

    expect(fetch).toHaveBeenCalledWith(
      'https://package.openupm.com/com.example.pkg',
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://package.openupm.com/downloads/range/2026-05-28:2026-06-11/com.example.pkg',
      expect.any(Object),
    );
    expect(upsertPackageDownloadsMock).toHaveBeenCalledWith('com.example.pkg', [
      { day: '2026-06-10', downloads: 5 },
    ]);
    expect(getPackageDownloadRangesMock).toHaveBeenCalledWith([
      'com.example.pkg',
    ]);
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(setPublicTrendsMock).toHaveBeenCalledTimes(1);
    expect(setPublicTrendsMock.mock.calls[0][0]).toMatchObject({
      catalogGrowth: {
        totalPackageSubmissionsByDay: [{ date: '2026-01', value: 1 }],
        totalActivePackagesByDay: [{ date: '2026-01', value: 1 }],
      },
      releaseActivity: {
        activePackagesLast12Months: 1,
        totalReleasesByTime: [
          { date: '2026-01', value: 1 },
          { date: '2026-02', value: 1 },
          { date: '2026-03', value: 2 },
        ],
        releasesPerMonth: [
          { date: '2026-01', value: 1 },
          { date: '2026-02', value: 0 },
          { date: '2026-03', value: 1 },
        ],
      },
      downloads: {
        totalDownloadsByTime: [
          { date: '2026-01', value: 7 },
          { date: '2026-02', value: 7 },
          { date: '2026-03', value: 7 },
          { date: '2026-04', value: 7 },
          { date: '2026-05', value: 7 },
          { date: '2026-06', value: 12 },
        ],
        downloadsPerMonth: [
          { date: '2026-01', value: 7 },
          { date: '2026-02', value: 0 },
          { date: '2026-03', value: 0 },
          { date: '2026-04', value: 0 },
          { date: '2026-05', value: 0 },
          { date: '2026-06', value: 5 },
        ],
      },
    });
  });

  it('backfills full download history on explicit backfill runs', async () => {
    mockPackageMetadata();
    mockReleases();

    const { buildTrendsSnapshotBackfillJob } = await import(
      '../../src/jobs/buildTrendsSnapshot.js'
    );
    await buildTrendsSnapshotBackfillJob();

    expect(fetch).toHaveBeenCalledWith(
      'https://package.openupm.com/downloads/range/2026-01-01:2026-06-11/com.example.pkg',
      expect.any(Object),
    );
  });

  it('caps full download backfill history to the OpenUPM era', async () => {
    mockPackageMetadata();
    loadPackageMetadataLocalMock.mockResolvedValueOnce({
      name: 'com.example.pkg',
      aliases: [],
      repoUrl: 'https://github.com/example/pkg',
      displayName: 'Pkg',
      description: '',
      licenseSpdxId: null,
      licenseName: '',
      topics: ['tools'],
      hunter: '',
      createdAt: Date.parse('1975-08-15T00:00:00.000Z') / 1000,
      trackingMode: 'githubRelease',
      repo: 'pkg',
      owner: 'example',
      ownerUrl: '',
      parentRepo: null,
      parentOwner: null,
      parentOwnerUrl: null,
      readmeBranch: 'main',
      hunterUrl: null,
    });
    mockReleases();

    const { buildTrendsSnapshotBackfillJob } = await import(
      '../../src/jobs/buildTrendsSnapshot.js'
    );
    await buildTrendsSnapshotBackfillJob();

    expect(fetch).toHaveBeenCalledWith(
      'https://package.openupm.com/downloads/range/2019-01-01:2026-06-11/com.example.pkg',
      expect.any(Object),
    );
  });

  it('backfills full download history for packages missing stored downloads', async () => {
    mockPackageMetadata();
    mockReleases();
    getPackageNamesWithoutDownloadsMock.mockReturnValue(['com.example.pkg']);

    const { buildTrendsSnapshotJob } = await import(
      '../../src/jobs/buildTrendsSnapshot.js'
    );
    await buildTrendsSnapshotJob();

    expect(fetch).toHaveBeenCalledWith(
      'https://package.openupm.com/downloads/range/2026-01-01:2026-06-11/com.example.pkg',
      expect.any(Object),
    );
  });

  it('caps missing package download backfills during recent refresh', async () => {
    mockPackageMetadata();
    loadPackageMetadataLocalMock.mockResolvedValueOnce({
      name: 'com.example.pkg',
      aliases: [],
      repoUrl: 'https://github.com/example/pkg',
      displayName: 'Pkg',
      description: '',
      licenseSpdxId: null,
      licenseName: '',
      topics: ['tools'],
      hunter: '',
      createdAt: Date.parse('1975-08-15T00:00:00.000Z') / 1000,
      trackingMode: 'githubRelease',
      repo: 'pkg',
      owner: 'example',
      ownerUrl: '',
      parentRepo: null,
      parentOwner: null,
      parentOwnerUrl: null,
      readmeBranch: 'main',
      hunterUrl: null,
    });
    mockReleases();
    getPackageNamesWithoutDownloadsMock.mockReturnValue(['com.example.pkg']);

    const { buildTrendsSnapshotJob } = await import(
      '../../src/jobs/buildTrendsSnapshot.js'
    );
    await buildTrendsSnapshotJob();

    expect(fetch).toHaveBeenCalledWith(
      'https://package.openupm.com/downloads/range/2019-01-01:2026-06-11/com.example.pkg',
      expect.any(Object),
    );
  });

  it('keeps packument-published releases when Redis has a retry state', async () => {
    mockPackageMetadata();
    fetchAllMock.mockResolvedValue([
      {
        packageName: 'com.example.pkg',
        version: '1.0.0',
        commit: '',
        tag: '',
        state: ReleaseState.Failed,
        buildId: '',
        reason: 0,
        createdAt: Date.parse('2026-06-01T00:00:00.000Z'),
        updatedAt: Date.parse('2026-06-01T00:00:00.000Z'),
        source: 'githubRelease',
        signed: true,
      },
    ]);

    const { buildTrendsSnapshotJob } = await import(
      '../../src/jobs/buildTrendsSnapshot.js'
    );
    await buildTrendsSnapshotJob();

    expect(setPublicTrendsMock.mock.calls[0][0]).toMatchObject({
      catalogGrowth: {
        totalActivePackagesByDay: [{ date: '2026-01', value: 1 }],
      },
      releaseActivity: {
        totalReleasesByTime: [
          { date: '2026-01', value: 1 },
          { date: '2026-02', value: 1 },
          { date: '2026-03', value: 2 },
        ],
      },
      trustAndDistribution: {
        signedPackagesByDay: [{ date: '2026-01', value: 1 }],
      },
    });
  });
});
