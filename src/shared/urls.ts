import urljoin from "url-join";
import { Region } from "./constant";
import { getCachedAvatarImageFilename, getRegion } from "./utils";

/**
 * Get base domain.
 * @returns base domain
 */
export const getBaseDomain = function (): string {
  return getRegion() == Region.CN ? "openupm.cn" : "openupm.com";
};

/**
 * Get web base url.
 * @returns web base url
 */
export const getWebBaseUrl = function (): string {
  return `https://${getBaseDomain()}`;
}

/**
 * Get package detail page path for package name.
 * @param packageName package name
 * @returns package detail page path
 */
export const getPackageDetailPagePath = function (packageName: string): string {
  return `/packages/${packageName}/`;
}

/**
 * Get package detail url for package name.
 * @param packageName package name
 * @returns package detail url
 */
export const getPackageDetailPageUrl = function (packageName: string): string {
  // FIXME: the com.unity test is wrong if hosting com.unity.xxx on the registry.
  if (packageName.startsWith("com.unity."))
    return `https://docs.unity3d.com/Packages/${packageName}@latest`;
  const webBaseUrl = getWebBaseUrl();
  return urljoin(webBaseUrl, getPackageDetailPagePath(packageName));
}

// OpenUPM GitHub repo url.
export const OpenUPMGitHubRepoUrl = "https://github.com/openupm/openupm";

/**
 * Get GitHub package metadata url for package name.
 * @param packageName package name
 * @returns GitHub package metadata url
 */
export const getGitHubPackageMetadataUrl = function (packageName: string): string {
  return urljoin(OpenUPMGitHubRepoUrl, "/blob/master/data/packages", packageName + ".yml");
}

/**
 * Get Azure DevOps build url for build id.
 * @param buildId Azure DevOps build id
 * @returns Azure DevOps build url
 */
export const getAzureWebBuildUrl = function (buildId: string): string {
  return `https://dev.azure.com/openupm/openupm/_build/results?view=logs&buildId=${buildId}`;
}

/**
 * Get media base url.
 * @returns media base url
 */
export const getMediaBaseUrl = function (): string {
  return getRegion() == Region.CN
    ? "https://download.openupm.cn/media/"
    : "https://openupm.sfo2.cdn.digitaloceanspaces.com/media/";
};

/**
 * Get package image url for image filename.
 * @param imageFilename image filename
 * @returns image url
 */
export const getPackageImageUrl = function (imageFilename: string): string | null {
  if (!imageFilename) return null;
  const mediaBaseUrl = getMediaBaseUrl();
  return urljoin(mediaBaseUrl, imageFilename);
};

/**
 * Get avatar image url for github user.
 * @param username github username
 * @param size image size in pixels
 * @returns image url
 */
export const getAvatarImageUrl = function (username: string, size: number): string {
  const mediaBaseUrl = getMediaBaseUrl();
  const filename = getCachedAvatarImageFilename(username, size);
  return urljoin(mediaBaseUrl, filename);
};

/**
 * Get api base url.
 * @returns api base url
 */
export const getAPIBaseUrl = function (): string {
  return `https://api.${getBaseDomain()}`;
}

/**
 * Get api base url.
 * @returns api base url
 */
export const getPackageInfoUrl = function (name: string): string {
  return urljoin(getAPIBaseUrl(), "packages", name);
}

/**
 * Get registry base url.
 * @returns registry base url
 */
export const getRegistryBaseUrl = function (): string {
  return `https://package.${getBaseDomain()}`;
}

/**
 * Get package metadata url for package name.
 * @param name package name
 * @returns package metadata url
 */
export const getPackageMetadataUrl = function (name: string): string {
  return urljoin(getRegistryBaseUrl(), name);
}

/**
 * Get monthly downloads url for package name.
 * @param name package name
 */
export const getMonthlyDownloadsUrl = function (name: string): string {
  return urljoin(getRegistryBaseUrl(), "downloads", "range", "last-month", name);
}