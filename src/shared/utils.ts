import { ValidationError } from "./custom-errors";

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