import {
  PackageMetadataLocal,
  PackageMetadataRemote,
  PackageMetadata,
  Region,
} from '@openupm/types';

import { ValidationError } from './custom-errors.js';
import { getPackageImageUrl } from './urls.js';

/**
 * Get environment variable value.
 * @param name environment variable name
 * @returns environment variable value
 */
// TODO: https://github.com/vitejs/vite/issues/1149#issuecomment-857686209
export const getEnv = function (name: string): string | undefined {
  return process.env[name];
};

/**
 * Get region from environment variable.
 * @returns region string
 */
export const getRegion = function (): string {
  return getEnv('VITE_OPENUPM_REGION') || Region.US;
};

/**
 * Return whether a package name is valid and the ValidationError instance
 * @param packageName package name
 * @returns [isValid, ValidationError instance]
 */
export const isValidPackageName = function (
  packageName: string,
): [boolean, ValidationError | null] {
  try {
    return [validPackageName(packageName), null];
  } catch (error) {
    if (error instanceof ValidationError) return [false, error];
    throw error;
  }
};

/**
 * Validate a package name based on https://docs.unity3d.com/Manual/cus-naming.html, throw ValidationError if invalid.
 * @param packageName package name
 * @returns {boolean} whether the package name is valid
 */
export const validPackageName = function (packageName: string): boolean {
  if (!packageName)
    throw new ValidationError('package name should not be empty', 'empty');
  const maxLength = 214;
  if (packageName.length > maxLength)
    throw new ValidationError(
      `package name length should be less or equal to ${maxLength}, but length is ${packageName.length}`,
      'max-length-error',
    );
  const nameRe = /^[a-z0-9._-]+$/;
  if (!nameRe.test(packageName))
    throw new ValidationError(
      'package name should contain only lowercase letters, digits, hyphens(-), underscores (_), and periods (.)',
      'invalid-characters-error',
    );
  const items = packageName.split('.');
  if (items.length < 3)
    throw new ValidationError(
      'package name should conform to reverse domain name notation with at least 3 components (tld.org-name.pkg-name)',
      'invalid-scopes-error',
    );
  return true;
};

/**
 * Return if the package name is blocked by the given block scope. The given block scope can
 * be a full package name or a scope starts with `^`.
 * @param {string} packageName - The name of the package to check
 * @param {string} scope - The block scope to check against
 * @returns {boolean} - Whether the package name is blocked by the given block scope
 */
export const isPackageBlockedByScope = function (
  packageName: string,
  scope: string,
): boolean {
  if (scope.startsWith('^'))
    return packageName.startsWith(scope.slice(1, scope.length));
  else return packageName == scope;
};

/**
 * Get the cached avatar image filename
 * @param {string} username - The username to generate the filename for
 * @param {number} size - The size of the avatar image
 * @returns {string} - The filename of the cached avatar image
 */
export const getCachedAvatarImageFilename = function (
  username: string,
  size: number,
): string {
  username = username.toLowerCase();
  return `${username}-${size}x${size}.png`;
};

/**
 * Parse package metadata remote
 * @param obj input object
 * @returns parsed PackageMetadataRemote object
 */
export function parsePackageMetadataRemote(
  obj: Record<string, unknown>,
): PackageMetadataRemote {
  const parsedObj: PackageMetadataRemote = {
    ver: obj.ver === undefined ? null : (obj.ver as string),
    time: obj.time === undefined ? 0 : (obj.time as number),
    stars: obj.stars === undefined ? 0 : (obj.stars as number),
    pstars: obj.pstars === undefined ? 0 : (obj.pstars as number),
    unity: obj.unity === undefined ? '2017.2' : (obj.unity as string),
    imageFilename:
      obj.imageFilename === undefined ? null : (obj.imageFilename as string),
    dl30d: obj.dl30d === undefined ? 0 : (obj.dl30d as number),
    repoUnavailable:
      obj.repoUnavailable === undefined
        ? false
        : (obj.repoUnavailable as boolean),
  };
  return parsedObj;
}

/**
 * Get package metadata by merging metadata local and metadata remote
 * @param metadataLocal package metadata local
 * @param metadataRemote package metadata remote
 * @returns full package metadata
 */
export const getPackageMetadata = function (
  metadataLocal: PackageMetadataLocal,
  metadataRemote: PackageMetadataRemote,
): PackageMetadata {
  const result = { ...metadataLocal, ...metadataRemote };
  // Override image field from image filename of metadata remote
  if (result.imageFilename)
    result.image = getPackageImageUrl(result.imageFilename);
  return result as PackageMetadata;
};

/**
 * Get localized package display name
 * @param metadata package metadata
 * @returns localized package display name
 */
export const getLocalePackageDisplayName = function (
  metadata: PackageMetadataLocal,
): string {
  return metadata.displayName || '';
};

/**
 * Get localized package description
 * @param metadata package metadata
 * @returns localized package description
 */
export const getLocalePackageDescription = function (
  metadata: PackageMetadataLocal,
): string {
  return metadata.description || '';
};

/**
 * Filter package metadata by topic slug
 * @param metadata package metadata local
 * @param topicSlug topic slug
 * @returns whether the package metadata should be filtered by the given topic slug
 */
export const filterMetadatabyTopicSlug = function (
  metadata: PackageMetadataLocal,
  topicSlug: string,
): boolean {
  if (metadata.excludedFromList) return false;
  else return metadata.topics.includes(topicSlug);
};

/**
 * Get package namespace scope `com.orgname` from package name `com.orgname.pkgname`.
 * @param packageName package name
 * @returns namespace scope
 */
export const getPackageNamespace = function (packageName: string): string {
  return packageName.split('.').slice(0, 2).join('.');
};

/**
 * Return whether the package requires manual verification.
 */
export const isPackageRequiresManualVerification = function (
  packageName: string,
): boolean {
  const name = packageName.toLowerCase();
  const scopes = [
    'com.amazonaws.',
    'com.google.',
    'com.unity.',
    'com.microsoft.',
    'com.apple.',
    'com.meta.',
    'com.oculus.',
    'com.twitter.',
    'com.x.',
    'com.facebook.',
  ];
  return scopes.some((scope) => name.includes(scope));
};
