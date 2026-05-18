import { PackageMetadataLocal, Topic } from '@openupm/types';

import {
  buildCrawlablePackageSummaries,
  buildPackageListDescription,
  buildPackageStructuredData,
  getLatestPackageLastModified,
  getPackageLastModified,
  structuredDataHead,
} from '../src/seo.js';

const topic = {
  name: 'AI',
  slug: 'ai',
  keywords: ['machine learning', 'llm'],
  urlPath: '/packages/topics/ai/',
} as Topic;

const packageMetadata = {
  name: 'com.example.ai',
  aliases: [],
  repoUrl: 'https://github.com/example/ai',
  displayName: 'Example AI',
  description: 'AI helpers for Unity projects.',
  licenseSpdxId: 'MIT',
  licenseName: 'MIT License',
  topics: ['ai'],
  hunter: 'hunter',
  createdAt: 1_700_000_000_000,
  image: 'https://example.com/cover.png',
  trackingMode: 'git',
  repo: 'ai',
  owner: 'example',
  ownerUrl: 'https://github.com/example',
  parentRepo: null,
  parentOwner: null,
  parentOwnerUrl: null,
  readmeBranch: 'main',
  hunterUrl: 'https://github.com/hunter',
} as PackageMetadataLocal;

describe('SEO metadata helpers', () => {
  it('builds descriptions for topic package pages', () => {
    expect(buildPackageListDescription(topic)).toContain(
      'OpenUPM Unity packages tagged AI',
    );
    expect(buildPackageListDescription(topic)).toContain('machine learning');
  });

  it('builds crawlable package summaries with stable package links', () => {
    expect(buildCrawlablePackageSummaries(topic, [packageMetadata])).toEqual([
      {
        description: 'AI helpers for Unity projects.',
        name: 'com.example.ai',
        path: '/packages/com.example.ai/',
        title: 'Example AI',
      },
    ]);
  });

  it('builds SoftwareApplication and breadcrumb JSON-LD for package pages', () => {
    const structuredData = buildPackageStructuredData(packageMetadata, [topic]);

    expect(structuredData[0]).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'Example AI',
      alternateName: 'com.example.ai',
      codeRepository: 'https://github.com/example/ai',
      keywords: 'AI',
    });
    expect(structuredData[1]).toMatchObject({
      '@type': 'BreadcrumbList',
    });
    expect(structuredDataHead(structuredData)[0][1]).toEqual({
      type: 'application/ld+json',
    });
  });

  it('uses latest package metadata timestamps for deterministic sitemap dates', () => {
    const packageLastModifiedMap = {
      [packageMetadata.name]: 1_710_000_000_000,
    };
    expect(getPackageLastModified(packageMetadata, packageLastModifiedMap)).toBe(
      '2024-03-09T16:00:00.000Z',
    );
    expect(
      getLatestPackageLastModified([packageMetadata], packageLastModifiedMap),
    ).toBe(
      '2024-03-09T16:00:00.000Z',
    );
  });
});
