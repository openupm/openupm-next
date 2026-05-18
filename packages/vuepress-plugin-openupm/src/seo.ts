import type { HeadConfig } from 'vuepress/core';

import { PackageMetadataLocal, Topic } from '@openupm/types';
import {
  getLocalePackageDescription,
  getLocalePackageDisplayName,
} from '@openupm/common/build/utils.js';
import {
  getPackageDetailPagePath,
  getPackageDetailPageUrl,
  getPackageListPagePath,
} from '@openupm/common/build/urls.js';

export type StructuredData = Record<string, unknown>;

export interface CrawlablePackageSummary {
  description: string;
  name: string;
  path: string;
  title: string;
}

export type PackageLastModifiedMap = Record<string, number | undefined>;

export const OPENUPM_FALLBACK_IMAGE = '/images/openupm-twitter.png';
const OPENUPM_ORIGIN = 'https://openupm.com';

const toIsoString = (timestamp: number): string | undefined => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return undefined;
  return new Date(timestamp).toISOString();
};

const stripMarkdownLinkSyntax = (value: string): string =>
  value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

const cleanText = (value: string): string =>
  stripMarkdownLinkSyntax(value)
    .replace(/\s+/g, ' ')
    .trim();

const truncateText = (value: string, maxLength: number): string => {
  const normalized = cleanText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const getPackageLastModified = (
  metadataLocal: PackageMetadataLocal,
  packageLastModifiedMap: PackageLastModifiedMap = {},
): string | undefined =>
  toIsoString(
    Math.max(
      packageLastModifiedMap[metadataLocal.name] || 0,
      metadataLocal.createdAt || 0,
    ),
  );

export const getLatestPackageLastModified = (
  metadataLocalList: PackageMetadataLocal[],
  packageLastModifiedMap: PackageLastModifiedMap = {},
): string | undefined => {
  const latestTimestamp = Math.max(
    ...metadataLocalList.map((metadataLocal) =>
      Math.max(
        packageLastModifiedMap[metadataLocal.name] || 0,
        metadataLocal.createdAt || 0,
      ),
    ),
  );
  return toIsoString(latestTimestamp);
};

export const buildPackageListDescription = (topic: Topic): string => {
  if (!topic.slug) {
    return 'Browse open-source Unity packages published through OpenUPM, including editor tools, runtime libraries, integrations, and package manager utilities.';
  }
  const keywords = topic.keywords.length
    ? ` Related keywords include ${topic.keywords.slice(0, 6).join(', ')}.`
    : '';
  return `Browse OpenUPM Unity packages tagged ${topic.name}, with package details, repository links, install instructions, and related package metadata.${keywords}`;
};

export const buildCrawlablePackageSummaries = (
  topic: Topic,
  metadataLocalList: PackageMetadataLocal[],
  limit = 8,
): CrawlablePackageSummary[] =>
  metadataLocalList
    .filter((metadataLocal) =>
      topic.slug ? metadataLocal.topics.includes(topic.slug) : true,
    )
    .filter((metadataLocal) => !metadataLocal.excludedFromList)
    .sort((a, b) => {
      const titleA = getLocalePackageDisplayName(a) || a.name;
      const titleB = getLocalePackageDisplayName(b) || b.name;
      return titleA.localeCompare(titleB);
    })
    .slice(0, limit)
    .map((metadataLocal) => ({
      description: truncateText(getLocalePackageDescription(metadataLocal), 180),
      name: metadataLocal.name,
      path: getPackageDetailPagePath(metadataLocal.name),
      title: getLocalePackageDisplayName(metadataLocal) || metadataLocal.name,
    }));

export const buildPackageListContent = (
  topic: Topic,
  summaries: CrawlablePackageSummary[],
): string => {
  const heading = topic.slug ? `${topic.name} Unity Packages` : 'Unity Packages';
  const summaryItems = summaries
    .map(
      (summary) =>
        `<li><a href="${escapeHtml(summary.path)}">${escapeHtml(summary.title)}</a> ` +
        `<span>${escapeHtml(summary.name)}</span> ` +
        `<span>${escapeHtml(summary.description)}</span></li>`,
    )
    .join('');
  return [
    '<section class="package-list-crawl-metadata" hidden>',
    `<h1>${escapeHtml(heading)}</h1>`,
    `<p>${escapeHtml(buildPackageListDescription(topic))}</p>`,
    summaryItems ? `<ul>${summaryItems}</ul>` : '',
    '</section>',
    '',
  ].join('\n');
};

export const buildPackageStructuredData = (
  metadataLocal: PackageMetadataLocal,
  topics: Topic[],
): StructuredData[] => {
  const displayName = getLocalePackageDisplayName(metadataLocal);
  const description = getLocalePackageDescription(metadataLocal);
  const packageUrl = getPackageDetailPageUrl(metadataLocal.name);
  const topicNames = topics.map((topic) => topic.name);
  const softwareApplication: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: displayName || metadataLocal.name,
    alternateName: metadataLocal.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Unity',
    description,
    url: packageUrl,
    codeRepository: metadataLocal.repoUrl,
    author: metadataLocal.owner
      ? {
          '@type': 'Organization',
          name: metadataLocal.owner,
          url: metadataLocal.ownerUrl,
        }
      : undefined,
    keywords: topicNames.length ? topicNames.join(', ') : undefined,
    image: metadataLocal.image || undefined,
    license: metadataLocal.licenseSpdxId || metadataLocal.licenseName || undefined,
    dateCreated: toIsoString(metadataLocal.createdAt),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
  const breadcrumbs: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Packages',
        item: `${OPENUPM_ORIGIN}${getPackageListPagePath()}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: displayName || metadataLocal.name,
        item: packageUrl,
      },
    ],
  };
  return [softwareApplication, breadcrumbs];
};

export const buildUnityNuGetStructuredData = (entry: {
  nugetId: string;
  packageName: string;
  version: string;
}): StructuredData[] => {
  const packageUrl = getPackageDetailPageUrl(entry.packageName);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: entry.nugetId,
      alternateName: entry.packageName,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Unity',
      description: `${entry.nugetId} is available as ${entry.packageName} through the OpenUPM registry UnityNuGet uplink.`,
      softwareVersion: entry.version,
      url: packageUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
        '@type': 'ListItem',
        position: 1,
        name: 'Packages',
        item: `${OPENUPM_ORIGIN}${getPackageListPagePath()}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: entry.nugetId,
          item: packageUrl,
        },
      ],
    },
  ];
};

export const structuredDataHead = (
  structuredData: StructuredData[],
): HeadConfig[] =>
  structuredData.map((item) => [
    'script',
    { type: 'application/ld+json' },
    JSON.stringify(item),
  ] as HeadConfig);
