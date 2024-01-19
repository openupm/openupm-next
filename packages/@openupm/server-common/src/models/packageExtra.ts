import sharp from 'sharp';
import config from 'config';

import { InvalidTag } from '@openupm/types';

import { loadPackageMetadataLocal } from '@openupm/local-data';

import redis from '../redis.js';
import { getImage } from '../utils/media.js';

const REDIS_KEY_ALL_PACKAGES_EXTRA = 'pkgs:extra';
const REDIS_KEY_PACKAGES_RECENT = 'pkgs:recent';
const REDIS_KEY_PACKAGE_EXTRA_PREFIX = 'pkg:';
export const propKeys: { [key: string]: string } = {
  stars: 'stars',
  monthlyDownloads: 'monthlyDownloads',
  readme: 'readme',
  readmeHtml: 'readmeHtml',
  parentStars: 'parentStars',
  scopes: 'scopes',
  invalidTags: 'invalidTags',
  aggregatedExtraData: 'aggregatedExtraData',
  ogImageCacheKey: 'ogImageCacheKey',
  imageUrl: 'imageUrl',
  readmeCacheKey: 'readmeCacheKey',
  repoUnavailable: 'repoUnavailable',
  repoUpdatedTime: 'repoUpdatedTime',
  repoPushedTime: 'repoPushedTime',
  updatedTime: 'updatedTime',
  version: 'version',
  unityVersion: 'unityVersion',
};

/**
 * Get the redis key for a package extra hashset.
 * @param {string} packageName - The name of the package.
 * @returns {string} The key for the package.
 */
export const getRedisKeyForPackageExtra = function (
  packageName: string,
): string {
  return REDIS_KEY_PACKAGE_EXTRA_PREFIX + packageName;
};

/**
 * Set the value of a property for a given package.
 * @param {string} packageName - The name of the package.
 * @param {string} propKey - The key of the property.
 * @param {string} propVal - The value of the property.
 * @returns {Promise<void>}
 */
const setValue = async function (
  packageName: string,
  propKey: string,
  propVal: string,
): Promise<void> {
  const key: string = getRedisKeyForPackageExtra(packageName);
  await redis.client!.hset(key, propKey, propVal);
};

/**
 * Get the value of a property for a given package.
 * @param {string} packageName - The name of the package.
 * @param {string} propKey - The key of the property.
 * @returns {Promise<string | null>} The value of the property.
 */
const getValue = async function (
  packageName: string,
  propKey: string,
): Promise<string | null> {
  const key: string = getRedisKeyForPackageExtra(packageName);
  return await redis.client!.hget(key, propKey);
};

/**
 * Get the property key appended with a language code except en-US.
 * @param {string} propKey - The property key.
 * @param {string} lang - The ISO 639-1 standard language code.
 * @returns {string} The property key for the specified language.
 */
export const getPropKeyForLang = function (
  propKey: string,
  lang: string = 'en-US',
): string {
  if (lang === 'en-US') return propKey;
  else if (lang === 'zh-CN') return propKey + '_zhCN';
  else throw new Error('Not implemented yet');
};

export const setInvalidTags = async function (
  packageName: string,
  tags: InvalidTag[],
): Promise<void> {
  const jsonText = JSON.stringify(tags, null, 0);
  await setValue(packageName, propKeys.invalidTags, jsonText);
};

export const getInvalidTags = async function (
  packageName: string,
): Promise<InvalidTag[]> {
  const jsonText = await getValue(packageName, propKeys.invalidTags);
  return jsonText === null ? [] : JSON.parse(jsonText);
};

export const setScopes = async function (
  packageName: string,
  scopes: string[],
): Promise<void> {
  const jsonText = JSON.stringify(scopes, null, 0);
  await setValue(packageName, propKeys.scopes, jsonText);
};

export const getScopes = async function (
  packageName: string,
): Promise<string[]> {
  const jsonText = await getValue(packageName, propKeys.scopes);
  return jsonText === null ? [] : JSON.parse(jsonText);
};

export const setVersion = async function (
  packageName: string,
  version: string,
): Promise<void> {
  await setValue(packageName, propKeys.version, version);
};

export const getVersion = async function (
  packageName: string,
): Promise<string | null> {
  const text = await getValue(packageName, propKeys.version);
  return text;
};

export const setUnityVersion = async function (
  packageName: string,
  unityVersion: string,
): Promise<void> {
  await setValue(packageName, propKeys.unityVersion, unityVersion);
};

export const getUnityVersion = async function (
  packageName: string,
): Promise<string | null> {
  const text = await getValue(packageName, propKeys.unityVersion);
  return text;
};

export const setStars = async function (
  packageName: string,
  stars: number,
): Promise<void> {
  await setValue(packageName, propKeys.stars, stars.toString());
};

export const getStars = async function (packageName: string): Promise<number> {
  const text = await getValue(packageName, propKeys.stars);
  return parseInt(text || '0');
};

export const setParentStars = async function (
  packageName: string,
  stars: number,
): Promise<void> {
  await setValue(packageName, propKeys.parentStars, stars.toString());
};

export const getParentStars = async function (
  packageName: string,
): Promise<number> {
  const text = await getValue(packageName, propKeys.parentStars);
  return parseInt(text || '0');
};

export const setReadme = async function (
  packageName: string,
  readme: string,
  lang?: string,
): Promise<void> {
  const key = getPropKeyForLang(propKeys.readme, lang);
  await setValue(packageName, key, readme);
};

export const getReadme = async function (
  packageName: string,
  lang?: string,
): Promise<string | null> {
  const key = getPropKeyForLang(propKeys.readme, lang);
  const text = await getValue(packageName, key);
  return text;
};

export const setReadmeCacheKey = async function (
  packageName: string,
  lang: string,
  cacheKey: string,
): Promise<void> {
  const key = getPropKeyForLang(propKeys.readmeCacheKey, lang);
  await setValue(packageName, key, cacheKey);
};

export const getReadmeCacheKey = async function (
  packageName: string,
  lang?: string,
): Promise<string | null> {
  const key = getPropKeyForLang(propKeys.readmeCacheKey, lang);
  const text = await getValue(packageName, key);
  return text;
};

export const setReadmeHtml = async function (
  packageName: string,
  readmeHtml: string,
  lang?: string,
): Promise<void> {
  const key = getPropKeyForLang(propKeys.readmeHtml, lang);
  await setValue(packageName, key, readmeHtml);
};

export const getReadmeHtml = async function (
  packageName: string,
  lang?: string,
): Promise<string | null> {
  const key = getPropKeyForLang(propKeys.readmeHtml, lang);
  const text = await getValue(packageName, key);
  return text;
};

export const setImageUrl = async function (
  packageName: string,
  imageUrl: string,
): Promise<void> {
  await setValue(packageName, propKeys.imageUrl, imageUrl);
};

export const getImageUrl = async function (
  packageName: string,
): Promise<string | null> {
  const text = await getValue(packageName, propKeys.imageUrl);
  return text;
};

export const setOGImageCacheKey = async function (
  packageName: string,
  cacheKey: string,
): Promise<void> {
  await setValue(packageName, propKeys.ogimageCacheKey, cacheKey);
};

export const getOGImageCacheKey = async function (
  packageName: string,
): Promise<string | null> {
  const text = await getValue(packageName, propKeys.ogimageCacheKey);
  return text;
};

export type ImageQuery = {
  imageUrl: string;
  width: number;
  height: number;
  fit: keyof sharp.FitEnum;
};

/**
 * Get image query data for a package, return { imageUrl, width, height, fit }
 * @param {string} packageName The name of the package
 * @returns {Promise<ImageQuery | null>} The image query data for the package, or null if no image is available
 */
export const getImageQueryForPackage = async function (
  packageName: string,
): Promise<ImageQuery | null> {
  // get the image url
  const pkg = await loadPackageMetadataLocal(packageName);
  if (!pkg) return null;
  let imageUrl = await getImageUrl(packageName);
  if (!imageUrl && pkg.image) {
    imageUrl = pkg.image;
  }
  if (!imageUrl) return null;
  const width = config.packageExtra.image.width;
  const height = config.packageExtra.image.height;
  const fit = pkg.imageFit == 'contain' ? 'contain' : 'cover';
  return { imageUrl, width, height, fit };
};

/**
 * Get image query data for a GitHub user, return { imageUrl, width, height, fit }
 * @param {string} username The username of the GitHub user
 * @param {number} size The size of the image
 * @returns {Promise<ImageQuery>} The image query data for the GitHub user
 */
export const getImageQueryForGithubUser = async function (
  username: string,
  size: number,
): Promise<ImageQuery> {
  // get the image url
  const imageUrl = `https://github.com/${username}.png?size=${size}`;
  return { imageUrl, width: size, height: size, fit: 'cover' };
};

/**
 * Get the cached image filename
 * @param {string} packageName The name of the package
 * @returns {Promise<string | null>} The filename of the cached image, or null if no image is available
 */
/**
 * Get the cached image filename
 * @param {string} packageName
 */
export const getCachedImageFilename = async function (
  packageName: string,
): Promise<string | null> {
  const q = await getImageQueryForPackage(packageName);
  if (q) {
    const imageData = await getImage(q.imageUrl, q.width, q.height, q.fit);
    if (imageData) return imageData.filename;
  }
  return null;
};

export const setRepoPushedTime = async function (
  packageName: string,
  value: number,
): Promise<void> {
  await setValue(packageName, propKeys.repoPushedTime, value.toString());
};

export const getRepoPushedTime = async function (
  packageName: string,
): Promise<number> {
  const value = await getValue(packageName, propKeys.repoPushedTime);
  return parseInt(value || '0') || 0;
};

export const setRepoUpdatedTime = async function (
  packageName: string,
  value: number,
): Promise<void> {
  await setValue(packageName, propKeys.repoUpdatedTime, value.toString());
};

export const getRepoUpdatedTime = async function (
  packageName: string,
): Promise<number> {
  const value = await getValue(packageName, propKeys.repoUpdatedTime);
  return parseInt(value || '0') || 0;
};

export const setRepoUnavailable = async function (
  packageName: string,
  value: boolean,
): Promise<void> {
  await setValue(packageName, propKeys.repoUnavailable, value ? '1' : '0');
};

export const getRepoUnavailable = async function (
  packageName: string,
): Promise<boolean> {
  const text = await getValue(packageName, propKeys.repoUnavailable);
  return text === '1';
};

export const setUpdatedTime = async function (
  packageName: string,
  updatedTime: number,
): Promise<void> {
  await setValue(packageName, propKeys.updatedTime, updatedTime.toString());
};

export const getUpdatedTime = async function (
  packageName: string,
): Promise<number> {
  const value = await getValue(packageName, propKeys.updatedTime);
  return parseInt(value || '0') || 0;
};

/**
 * Get monthly downloads for a package.
 * @param {string} packageName - The name of the package.
 * @returns {Promise<number>} - A Promise that resolves to the number of downloads.
 */
export const getMonthlyDownloads = async function (
  packageName: string,
): Promise<number> {
  const value = await getValue(packageName, propKeys.monthlyDownloads);
  return parseInt(value || '0') || 0;
};

/**
 * Set monthly downloads for a package.
 * @param {string} packageName - The name of the package.
 * @param {number} downloads - The number of downloads to set.
 * @returns {Promise<void>} - A Promise that resolves when the downloads have been set.
 */
export const setMonthlyDownloads = async function (
  packageName: string,
  downloads: number,
): Promise<void> {
  await setValue(packageName, propKeys.monthlyDownloads, downloads.toString());
};

/**
 * Set aggregated extra data.
 * @param {object} obj
 */
export const setAggregatedExtraData = async function (obj): Promise<void> {
  const jsonText = JSON.stringify(obj, null, 0);
  await redis.client!.set(REDIS_KEY_ALL_PACKAGES_EXTRA, jsonText);
};

/**
 * Get aggregated extra data.
 * @returns {Promise<object>} - A Promise that resolves to the aggregated extra data.
 */
export const getAggregatedExtraData = async function (): Promise<object> {
  const jsonText = await redis.client?.get(REDIS_KEY_ALL_PACKAGES_EXTRA);
  return jsonText === null ? {} : JSON.parse(jsonText || '{}');
};

/**
 * Set recent packages.
 * @param {object} obj
 */
export const setRecentPackages = async function (arr: string[]): Promise<void> {
  const jsonText = JSON.stringify(arr, null, 0);
  await redis.client!.set(REDIS_KEY_PACKAGES_RECENT, jsonText);
};

/**
 * Get recent packages.
 */
export const getRecentPackages = async function (): Promise<string[]> {
  const jsonText = await redis.client!.get(REDIS_KEY_PACKAGES_RECENT);
  return jsonText === null ? [] : JSON.parse(jsonText);
};
