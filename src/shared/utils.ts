import { ValidationError } from "./custom-errors";
import { PackageMetadataLocal, PackageMetadataRemote, PackageMetadata } from "./types";
import { Region } from "./constant";

/**
 * Get environment variable value.
 * @param name environment variable name
 * @returns environment variable value
 */
export const getEnv = function (name: string): string | undefined {
  if (import.meta && import.meta.env) return import.meta.env[name];
  else if (typeof process !== 'undefined' && process.env) return process.env[name];
}

/**
 * Get region from environment variable.
 * @returns region string
 */
export const getRegion = function (): string {
  return getEnv("VITE_OPENUPM_REGION") || Region.US;
}

/**
 * Return whether a package name is valid and the ValidationError instance
 * @param packageName package name
 * @returns [isValid, ValidationError instance]
 */
export const isValidPackageName = function (packageName: string): [boolean, ValidationError | null] {
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
    throw new ValidationError("package name should not be empty", "empty");
  const maxLength = 214;
  if (packageName.length > maxLength)
    throw new ValidationError(
      `package name length should be less or equal to ${maxLength}, but length is ${packageName.length}`,
      "max-length-error"
    );
  const nameRe = /^[a-z0-9._-]+$/;
  if (!nameRe.test(packageName))
    throw new ValidationError(
      "package name should contain only lowercase letters, digits, hyphens(-), underscores (_), and periods (.)",
      "invalid-characters-error"
    );
  const items = packageName.split(".");
  if (items.length < 3)
    throw new ValidationError(
      "package name should conform to reverse domain name notation with at least 3 components (tld.org-name.pkg-name)",
      "invalid-scopes-error"
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
export const isPackageBlockedByScope = function (packageName: string, scope: string): boolean {
  if (scope.startsWith("^"))
    return packageName.startsWith(scope.slice(1, scope.length));
  else
    return packageName == scope;
};

/**
 * Get the cached avatar image filename
 * @param {string} username - The username to generate the filename for
 * @param {number} size - The size of the avatar image
 * @returns {string} - The filename of the cached avatar image
 */
export const getCachedAvatarImageFilename = function (username: string, size: number): string {
  username = username.toLowerCase();
  return `${username}-${size}x${size}.png`;
};

/**
 * Parse package metadata remote
 * @param obj input object
 * @returns parsed PackageMetadataRemote object
 */
export const parsePackageMetadataRemote = function (obj: any): PackageMetadataRemote {
  if (obj.ver === undefined) obj.ver = null;
  if (obj.time === undefined) obj.time = 0;
  if (!obj.stars) obj.stars = 0;
  if (!obj.pstars) obj.pstars = 0;
  if (!obj.unity) obj.unity = "2017.2";
  if (!obj.imageFilename) obj.imageFilename = null;
  if (!obj.dl30d) obj.dl30d = 0;
  if (!obj.repoUnavailable) obj.repoUnavailable = false;
  return obj as PackageMetadataRemote;
}

/**
 * Get package metadata by merging metadata local and metadata remote
 * @param metadataLocal package metadata local
 * @param metadataRemote package metadata remote
 * @returns full package metadata
 */
export const getPackageMetadata = function (metadataLocal: PackageMetadataLocal, metadataRemote: PackageMetadataRemote): PackageMetadata {
  const result = { ...metadataLocal, ...metadataRemote };
  return result as PackageMetadata;
}

/**
 * Get localized package display name
 * @param metadata package metadata
 * @returns localized package display name
 */
export const getLocalePackageDisplayName = function (metadata: PackageMetadataLocal): string {
  const region = getRegion();
  if (region == Region.CN) return metadata.displayName_zhCN || metadata.displayName || "";
  return metadata.displayName || "";
}

/**
 * Get localized package description
 * @param metadata package metadata
 * @returns localized package description
 */
export const getLocalePackageDescription = function (metadata: PackageMetadataLocal): string {
  const region = getRegion();
  if (region == Region.CN) return metadata.description_zhCN || metadata.description || "";
  return metadata.description || "";
}

/**
 * Filter package metadata by topic slug
 * @param metadata package metadata local
 * @param topicSlug topic slug
 * @returns whether the package metadata should be filtered by the given topic slug
 */
export const filterMetadatabyTopicSlug = function (metadata: PackageMetadataLocal, topicSlug: string) {
  if (metadata.excludedFromList) return false;
  else return metadata.topics.includes(topicSlug);
}

/**
 * Get package namespace scope `com.orgname` from package name `com.orgname.pkgname`.
 * @param packageName package name
 * @returns namespace scope
 */
export const getPackageNamespace = function (packageName: string): string {
  return packageName
    .split(".")
    .slice(0, 2)
    .join(".");
};

/**
 * Return whether the package requires manual verification.
 */
export const isPackageRequiresManualVerification = function (packageName: string): boolean {
  const name = packageName.toLowerCase();
  const scopes = [
    "com.amazonaws.",
    "com.google.",
    "com.unity.",
    "com.microsoft.",
    "com.apple.",
    "com.meta.",
    "com.oculus.",
    "com.twitter.",
    "com.x.",
    "com.facebook.",
  ];
  return scopes.some(scope => name.includes(scope));
}