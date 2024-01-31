import { PackageMetadataLocal } from '@openupm/types';

/**
 * Collects text from a package, including
 * - displayName or words from the package name's last section.
 * - description.
 * @param pkg The package to collect text from.
 * @returns The collected text.
 */
export function collectTextFromPackage(pkg: PackageMetadataLocal): string {
  let name = pkg.displayName;
  if (!name) {
    name = pkg.name.split('.').splice(-1)[0].split('-').join(' ');
  }
  const text = `${name} ${pkg.description}`;
  return text;
}
