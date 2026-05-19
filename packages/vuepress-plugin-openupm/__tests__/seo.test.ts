import { PackageMetadataLocal, Topic } from '@openupm/types';

import {
  buildCrawlablePackageSummaries,
  buildPackageDetailContent,
  buildPackageDetailDescription,
  buildPackageDetailTitle,
  buildPackageListContent,
  buildPackageListDescription,
  buildPackageListTitle,
  buildRelatedPackageSummaries,
  buildRelatedPackageSummaryIndex,
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

  it('builds specific package list titles', () => {
    expect(buildPackageListTitle(topic)).toBe('AI Unity Packages | OpenUPM');
    expect(buildPackageListTitle({ ...topic, slug: '' })).toBe(
      'Unity Packages for OpenUPM',
    );
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

  it('builds package detail titles and descriptions without empty snippets', () => {
    expect(buildPackageDetailTitle(packageMetadata)).toBe(
      'Example AI (com.example.ai) | OpenUPM Unity Package',
    );
    expect(buildPackageDetailDescription(packageMetadata)).toContain(
      'Install Example AI by example from the OpenUPM Unity package registry',
    );
  });

  it('builds hidden topic fallback content without affecting the package grid design', () => {
    const content = buildPackageListContent(topic, [
      {
        description: 'AI helpers for Unity projects.',
        name: 'com.example.ai',
        path: '/packages/com.example.ai/',
        title: 'Example AI',
      },
    ]);

    expect(content).toContain(
      '<section class="package-list-crawl-metadata" hidden>',
    );
    expect(content).not.toContain('Useful docs');
    expect(content).toContain('/packages/com.example.ai/');
  });

  it('builds related package summaries from shared topics and owner', () => {
    const metadataList = [
      packageMetadata,
      {
        ...packageMetadata,
        name: 'com.example.ai.tools',
        displayName: 'Example AI Tools',
        description: 'Extra AI tooling.',
      },
      {
        ...packageMetadata,
        name: 'com.other.rendering',
        displayName: 'Rendering',
        topics: ['rendering'],
        owner: 'other',
      },
    ];
    const related = buildRelatedPackageSummaries(packageMetadata, metadataList);
    const getRelatedPackageSummaries =
      buildRelatedPackageSummaryIndex(metadataList);

    expect(related).toEqual([
      {
        description: 'Extra AI tooling.',
        name: 'com.example.ai.tools',
        path: '/packages/com.example.ai.tools/',
        title: 'Example AI Tools',
      },
    ]);
    expect(getRelatedPackageSummaries(packageMetadata)).toEqual(related);
  });

  it('builds hidden package detail fallback content with install, topic, related, and owner links', () => {
    const content = buildPackageDetailContent(packageMetadata, {
      relatedPackages: [
        {
          description: 'Extra AI tooling.',
          name: 'com.example.ai.tools',
          path: '/packages/com.example.ai.tools/',
          title: 'Example AI Tools',
        },
      ],
      topics: [topic],
    });

    expect(content).not.toContain('noindex');
    expect(content).not.toContain('nofollow');
    expect(content).toContain(
      '<section class="package-detail-crawl-metadata" hidden>',
    );
    expect(content).toContain('/docs/getting-started-cli.html');
    expect(content).toContain('/docs/scoped-registry-troubleshooting.html');
    expect(content).toContain('/packages/topics/ai/');
    expect(content).toContain('/packages/com.example.ai.tools/');
    expect(content).toContain('https://github.com/example');
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

  it('escapes JSON-LD script-breaking characters', () => {
    const structuredData = structuredDataHead([
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: '</script><script>alert(1)</script>',
      },
    ]);

    expect(structuredData[0][2]).toContain('\\u003c/script\\u003e');
    expect(structuredData[0][2]).not.toContain('</script>');
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
