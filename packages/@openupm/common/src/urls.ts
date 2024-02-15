import urlJoin from 'url-join';
import { PUBLIC_GEN_DIR, Region } from '@openupm/types';

import {
  getCachedAvatarImageFilename,
  getEnv,
  getRegion,
  getPackageNamespace,
} from './utils.js';

/**
 * Get base domain.
 * @returns base domain
 */
export const getBaseDomain = function (): string {
  return getRegion() == Region.CN ? 'openupm.cn' : 'openupm.com';
};

/**
 * Get web base url.
 * @returns web base url
 */
export const getWebBaseUrl = function (): string {
  return `https://${getBaseDomain()}`;
};

/**
 * Get package detail page path for package name.
 * @param packageName package name
 * @returns package detail page path
 */
export const getPackageDetailPagePath = function (packageName: string): string {
  return `/packages/${packageName}/`;
};

/**
 * Get package detail url for package name.
 * @param packageName package name
 * @returns package detail url
 */
export const getPackageDetailPageUrl = function (packageName: string): string {
  const webBaseUrl = getWebBaseUrl();
  return urlJoin(webBaseUrl, getPackageDetailPagePath(packageName));
};

/**
 * Get package's related packages page path for package name.
 * @param packageName package name
 * @returns package detail page path
 */
export const getPackageRelatedPackagesPath = function (
  packageName: string,
): string {
  const scope = getPackageNamespace(packageName);
  return urlJoin('/', PUBLIC_GEN_DIR, scope + '.json');
};

/**
 * Get public gen path for path.
 * @param path path
 * @returns public gen path
 */
export const getPublicGenPath = function (path: string): string {
  return urlJoin('/', PUBLIC_GEN_DIR, path);
};

/**
 * Get public gen url for path.
 * @param path path
 * @returns public gen url
 */
export const getPublicGenUrl = function (path: string): string {
  const webBaseUrl = getWebBaseUrl();
  return urlJoin(webBaseUrl, getPublicGenPath(path));
};

/**
 * Get package list page path for topic.
 * @param topic topic
 * @returns package list page path
 */
export const getPackageListPagePath = function (topic?: string): string {
  if (topic) return `/packages/topics/${topic}/`;
  return '/packages/';
};

// OpenUPM GitHub repo url.
export const OpenUPMGitHubRepoUrl = 'https://github.com/openupm/openupm';

/**
 * Get GitHub package metadata url for package name.
 * @param packageName package name
 * @returns GitHub package metadata url
 */
export const getGitHubPackageMetadataUrl = function (
  packageName: string,
): string {
  return urlJoin(
    OpenUPMGitHubRepoUrl,
    '/blob/master/data/packages',
    packageName + '.yml',
  );
};

/**
 * Get GitHub raw file url for given github html url.
 * @param url github html url
 * @returns GitHub raw file url
 */
export const getGitHubRawFileUrl = function (url: string): string {
  const githubBlobRe = /^https?:\/\/github\.com\/.*\/.*\/blob\//i;
  if (githubBlobRe.test(url)) url = url.replace(/\/blob\//, '/raw/');
  return url;
};

/**
 * Get GitHub avatar image url for github user.
 * @param username github username
 * @param size image size in pixels
 * @returns image url
 */
export const getGitHubAvatarUrl = function (
  username: string,
  size: number,
): string {
  return urlJoin('https://github.com/', username + '.png?size=' + size);
};

/**
 * Get Azure DevOps build url for build id.
 * @param buildId Azure DevOps build id
 * @returns Azure DevOps build url
 */
export const getAzureWebBuildUrl = function (buildId: string): string {
  return `https://dev.azure.com/openupm/openupm/_build/results?view=logs&buildId=${buildId}`;
};

/**
 * Get media base url.
 * @returns media base url
 */
export const getMediaBaseUrl = function (): string {
  return getRegion() == Region.CN
    ? 'https://download.openupm.cn/media/'
    : 'https://openupm.sfo2.cdn.digitaloceanspaces.com/media/';
};

/**
 * Get package image url for image filename.
 * @param imageFilename image filename
 * @returns image url
 */
export const getPackageImageUrl = function (
  imageFilename: string,
): string | null {
  if (!imageFilename) return null;
  const mediaBaseUrl = getMediaBaseUrl();
  return urlJoin(mediaBaseUrl, imageFilename);
};

/**
 * Get avatar image url for github user.
 * @param username github username
 * @param size image size in pixels
 * @returns image url
 */
export const getAvatarImageUrl = function (
  username: string,
  size: number,
): string {
  const mediaBaseUrl = getMediaBaseUrl();
  const filename = getCachedAvatarImageFilename(username, size);
  return urlJoin(mediaBaseUrl, filename);
};

/**
 * Get api base url.
 * @returns api base url
 */
export const getAPIBaseUrl = function (): string {
  const apiServerUrl = getEnv('VITE_OPENUPM_API_SERVER_URL');
  if (apiServerUrl) return apiServerUrl;
  return `https://api.${getBaseDomain()}`;
};

/**
 * Get api base url.
 * @returns api base url
 */
export const getPackageInfoUrl = function (name: string): string {
  return urlJoin(getAPIBaseUrl(), 'packages', name);
};

/**
 * Get registry base url.
 * @returns registry base url
 */
export const getRegistryBaseUrl = function (): string {
  return `https://package.${getBaseDomain()}`;
};

/**
 * Get package metadata url for package name.
 * @param name package name
 * @returns package metadata url
 */
export const getPackumentUrl = function (name: string): string {
  return urlJoin(getRegistryBaseUrl(), name);
};

/**
 * Get monthly downloads url for package name.
 * @param name package name
 */
export const getMonthlyDownloadsUrl = function (name: string): string {
  return urlJoin(
    getRegistryBaseUrl(),
    'downloads',
    'range',
    'last-month',
    name,
  );
};

/**
 * Get openupm-cli repo url.
 * @returns openupm-cli repo url
 */
export const getOpenupmCliRepoUrl = function (): string {
  return 'https://github.com/openupm/openupm-cli#openupm-cli';
};

/**
 * Get Node.js download url.
 * @returns Node.js download url
 */
export const getNodeJsUrl = function (): string {
  return 'https://nodejs.org/en/download/';
};

const packageDetailRe = new RegExp('^/packages/([\\w.-]+)/$', 'i');

/**
 * Test if path is package detail path.
 * @param path url path
 */
export const isPackageDetailPath = function (path: string): boolean {
  return packageDetailRe.test(path);
};

export const parsePackageNameFromPackageDetailPath = function (
  path: string,
): string | null {
  const match = packageDetailRe.exec(path);
  return match ? match[1] : null;
};

const packageListRe = new RegExp('^/packages/topics/[\\w.-]+/$', 'i');

/**
 * Test if path is package list path.
 * @param path url path
 */
export const isPackageListPath = function (path: string): boolean {
  return path === '/packages/' || packageListRe.test(path);
};

export const getUnityRegistryUrl = function (): string {
  return getRegion() == Region.CN
    ? 'https://packages.unity.cn'
    : 'https://packages.unity.com';
};

export const getLocaleDocsPath = function (path: string): string {
  const regionPath = getRegion() == Region.CN ? '/zh' : '/';
  return urlJoin(regionPath, path);
};

/**
 * Get the URL for the package ad placement.
 * @param packageName The name of the package.
 * @returns The URL for the package ad placement.
 */
export function getPackageAdPlacementUrl(packageName: string): string {
  return urlJoin(getAPIBaseUrl(), 'ads', 'pkg', packageName);
}

/**
 * Get the URL for the topic ad placement.
 * @param topicSlug The slug of the topic.
 * @returns The URL for the topic ad placement.
 */
export function getTopicAdPlacementUrl(topicSlug: string): string {
  return urlJoin(getAPIBaseUrl(), 'ads', 'topic', topicSlug);
}
