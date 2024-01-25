// import config from 'config';

import { AdAssetStore } from '@openupm/types';
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
  let name = pkg.displayName;
  if (!name) {
    name = pkg.name.split('.').splice(-1)[0].split('-').join(' ');
  }
  const text = `${name} ${pkg.description}`;
  const result = await getKeywords(text);
  if (result.keywords.length) console.log(result.keywords.join(', '));
  if (result.keyphrases.length) console.log(result.keyphrases.join(', '));
  console.log();
  return null;
}
