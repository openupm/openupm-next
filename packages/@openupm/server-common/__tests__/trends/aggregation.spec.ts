import { describe, expect, it } from 'vitest';
import { ReleaseState } from '@openupm/types';

import { buildPublicTrends } from '../../src/trends/aggregation.js';

describe('trends aggregation', () => {
  it('builds package, topic, signed, release, and download series', () => {
    const trends = buildPublicTrends({
      generatedAt: new Date('2026-06-11T00:00:00.000Z'),
      topics: [
        { slug: 'tools', name: 'Tools', keywords: [] },
        { slug: 'ai', name: 'AI', keywords: [] },
      ],
      packages: [
        {
          name: 'com.example.alpha',
          aliases: [],
          repoUrl: 'https://github.com/example/alpha',
          displayName: 'Alpha',
          description: '',
          licenseSpdxId: null,
          licenseName: '',
          topics: ['tools'],
          hunter: '',
          createdAt: Date.parse('2026-01-01T00:00:00.000Z') / 1000,
          trackingMode: 'git',
          repo: 'alpha',
          owner: 'example',
          ownerUrl: '',
          parentRepo: null,
          parentOwner: null,
          parentOwnerUrl: null,
          readmeBranch: 'main',
          hunterUrl: null,
        },
        {
          name: 'com.example.beta',
          aliases: [],
          repoUrl: 'https://github.com/example/beta',
          displayName: 'Beta',
          description: '',
          licenseSpdxId: null,
          licenseName: '',
          topics: ['tools', 'ai'],
          hunter: '',
          createdAt: Date.parse('2026-02-01T00:00:00.000Z') / 1000,
          trackingMode: 'githubRelease',
          repo: 'beta',
          owner: 'example',
          ownerUrl: '',
          parentRepo: null,
          parentOwner: null,
          parentOwnerUrl: null,
          readmeBranch: 'main',
          hunterUrl: null,
        },
      ],
      releases: [
        {
          packageName: 'com.example.beta',
          version: '1.0.0',
          commit: '',
          tag: '1.0.0',
          state: ReleaseState.Succeeded,
          buildId: '',
          reason: 0,
          createdAt: Date.parse('2026-02-03T00:00:00.000Z'),
          updatedAt: Date.parse('2026-02-03T00:00:00.000Z'),
          source: 'githubRelease',
          signed: true,
        },
        {
          packageName: 'com.example.alpha',
          version: '1.1.0',
          commit: '',
          tag: '1.1.0',
          state: ReleaseState.Succeeded,
          buildId: '',
          reason: 0,
          createdAt: Date.parse('2026-04-03T00:00:00.000Z'),
          updatedAt: Date.parse('2026-04-03T00:00:00.000Z'),
          source: 'git',
          signed: false,
        },
      ],
      downloadRanges: [
        {
          package: 'com.example.alpha',
          downloads: [
            { day: '2026-02-01', downloads: 3 },
            { day: '2026-02-02', downloads: 5 },
            { day: '2026-04-01', downloads: 17 },
          ],
        },
        {
          package: 'com.example.beta',
          downloads: [
            { day: '2026-02-01', downloads: 11 },
            { day: '2026-02-02', downloads: 13 },
          ],
        },
      ],
    });

    expect(trends.generatedAt).toEqual('2026-06-11T00:00:00.000Z');
    expect(trends.catalogGrowth.totalPackageSubmissionsByDay.at(-1)).toEqual({
      date: '2026-02',
      value: 2,
    });
    expect(trends.catalogGrowth.totalActivePackagesByDay).toEqual([
      { date: '2026-01', value: 0 },
      { date: '2026-02', value: 1 },
      { date: '2026-03', value: 1 },
      { date: '2026-04', value: 2 },
    ]);
    expect(
      trends.catalogGrowth.packageSubmissionsByTopicByDay
        .find((series) => series.key === 'tools')
        ?.points.at(-1),
    ).toEqual({ date: '2026-02', value: 2 });
    expect(trends.trustAndDistribution.signedPackagesByDay.at(-1)).toEqual({
      date: '2026-02',
      value: 1,
    });
    expect(
      trends.trustAndDistribution.releaseSourceAndSigningByDay.map(
        (series) => series.key,
      ),
    ).toEqual(['githubReleaseAssets', 'gitSource']);
    expect(trends.releaseActivity.totalReleasesByTime).toEqual([
      { date: '2026-02', value: 1 },
      { date: '2026-03', value: 1 },
      { date: '2026-04', value: 2 },
    ]);
    expect(trends.releaseActivity.releasesPerMonth).toEqual([
      { date: '2026-02', value: 1 },
      { date: '2026-03', value: 0 },
      { date: '2026-04', value: 1 },
    ]);
    expect(trends.downloads.totalDownloadsByTime).toEqual([
      { date: '2026-02', value: 32 },
      { date: '2026-03', value: 32 },
      { date: '2026-04', value: 49 },
    ]);
    expect(trends.downloads.downloadsPerMonth).toEqual([
      { date: '2026-02', value: 32 },
      { date: '2026-03', value: 0 },
      { date: '2026-04', value: 17 },
    ]);
  });

  it('caps impossible package metadata dates to the OpenUPM era', () => {
    const trends = buildPublicTrends({
      generatedAt: new Date('2026-06-11T00:00:00.000Z'),
      topics: [{ slug: 'tools', name: 'Tools', keywords: [] }],
      packages: [
        {
          name: 'com.example.legacy',
          aliases: [],
          repoUrl: 'https://github.com/example/legacy',
          displayName: 'Legacy',
          description: '',
          licenseSpdxId: null,
          licenseName: '',
          topics: ['tools'],
          hunter: '',
          createdAt: Date.parse('1975-08-15T00:00:00.000Z') / 1000,
          trackingMode: 'githubRelease',
          repo: 'legacy',
          owner: 'example',
          ownerUrl: '',
          parentRepo: null,
          parentOwner: null,
          parentOwnerUrl: null,
          readmeBranch: 'main',
          hunterUrl: null,
        },
      ],
      releases: [],
      downloadRanges: [],
    });

    expect(trends.coverage.catalogGrowth.start).toEqual('2019-01-01');
    expect(trends.catalogGrowth.totalPackageSubmissionsByDay).toEqual([
      { date: '2019-01', value: 1 },
    ]);
    expect(
      trends.catalogGrowth.packageSubmissionsByTopicByDay[0].points,
    ).toEqual([{ date: '2019-01', value: 1 }]);
    expect(
      trends.trustAndDistribution.releaseSourceAndSigningByDay
        .find((series) => series.key === 'githubReleaseAssets')
        ?.points,
    ).toEqual([{ date: '2019-01', value: 1 }]);
  });
});
