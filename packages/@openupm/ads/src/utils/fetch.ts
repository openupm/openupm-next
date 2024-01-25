// import config from 'config';

import { AdAssetStore, PackageMetadataLocal } from '@openupm/types';
import { loadPackageMetadataLocal } from '@openupm/local-data';

import { getKeywords } from './keyword.js';

/**
 * Fetches an AdAssetStore for a given package name.
 * @param packageName The name of the package to fetch an AdAssetStore for.
 * @returns The AdAssetStore object.
 */
export async function fetchAdPackageToAssetStore(
  packageName: string,
): Promise<AdAssetStore | null> {
  const pkg = await loadPackageMetadataLocal(packageName);
  if (pkg === null) {
    console.warn(`package ${packageName} not found`);
    return null;
  }
  // Get text for the package.
  const text = getTextForPackage(pkg);
  // Get keywords for the text.
  const result = await getKeywords(text);
  // Merge keywords and keyphrases into a single array
  const keywords = [...result.keyphrases, ...result.keywords];
  if (keywords.length) console.log(keywords.join(', '));
  // TODO: fetch ad-assetstore for the package
  console.log();
  return null;
}

function getTextForPackage(pkg: PackageMetadataLocal): string {
  let name = pkg.displayName;
  if (!name) {
    name = pkg.name.split('.').splice(-1)[0].split('-').join(' ');
  }
  const text = `${name} ${pkg.description}`;
  return text;
}
