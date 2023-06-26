import urljoin from "url-join";
import { getCachedAvatarImageFilename, getEnv } from "./utils";

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
 * Get media base url.
 * @returns media base url
 */
export const getMediaBaseUrl = function (): string {
  const region = getEnv("VITE_OPENUPM_REGION");
  return region == "cn"
    ? "https://download.openupm.cn/media/"
    : "https://openupm.sfo2.cdn.digitaloceanspaces.com/media/";
};

/**
 * Get base domain.
 * @returns base domain
 */
export const getBaseDomain = function (): string {
  const region = getEnv("VITE_OPENUPM_REGION");
  return region == "cn" ? "openupm.cn" : "openupm.com";
};

/**
 * Get api base url.
 * @returns api base url
 */
export const getAPIBaseUrl = function (): string {
  return `https://api.${getBaseDomain()}`;
}

/**
 * Get registry base url.
 * @returns registry base url
 */
export const getRegistryBaseUrl = function (): string {
  return `https://package.${getBaseDomain()}`;
}