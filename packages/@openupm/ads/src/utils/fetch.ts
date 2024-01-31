import config from 'config';
import fetch from 'node-fetch';
import { Logger } from 'ts-log';

import { AdAssetStore } from '@openupm/types';
import { loadPackageMetadataLocal } from '@openupm/local-data';

import { getKeywords } from './keyword.js';
import {
  AssetStorePackage,
  AssetStoreSearchResult,
} from '../types/assetStore.js';
import { setAdAssetStore } from '../models/adAssetStore.js';
import { convertAssetStorePackageToAdAssetStore } from './convert.js';
import { collectTextFromPackage } from './collectText.js';
import { setPackageToAdAssetStoreIds } from '../models/packageToAdAssetStoreIds.js';

/**
 * Fetches AdAssetStore id list for a given package name.
 * @param packageName The name of the package.
 * @param logger The logger.
 * @returns The AdAssetStore id list.
 */
export async function fetchPackageToAdAssetStoreIds(
  packageName: string,
  logger: Logger,
): Promise<string[] | null> {
  const pkg = await loadPackageMetadataLocal(packageName);
  if (pkg === null) {
    logger.warn(`package ${packageName} not found`);
    return null;
  }
  // Get text for the package.
  const text = collectTextFromPackage(pkg);
  // Get keywords for the text.
  const result = await getKeywords(text);
  // Merge keywords and keyphrases into a single array.
  const keywords = [...result.keyphrases, ...result.keywords];
  if (keywords.length) logger.info(`keywords: ${keywords.join(', ')}`);
  // fetch ad-assetstore list for the keywords.
  for (const keyword of keywords) {
    // Search asset store for the keyword.
    const result = await searchAssetStore(keyword);
    // Sort result by hotness descending.
    const assetStorePackages: AssetStorePackage[] = result.results
      .sort((a, b) => {
        return parseFloat(b.hotness) - parseFloat(a.hotness);
      })
      // Filter out free packages.
      .filter((assetStorePackage) => {
        return assetStorePackage.price_usd !== '0.00';
      })
      // Limit the size of the list.
      .slice(0, config.packageToAdAssetStoreIdListSize);
    logger.info(
      `found ${assetStorePackages.length} paid adAssetStores for the keyword '${keyword}'`,
    );
    const adAssetStoreItems: AdAssetStore[] = [];
    for (const AssetStorePackage of assetStorePackages) {
      const adAssetStore =
        convertAssetStorePackageToAdAssetStore(AssetStorePackage);
      adAssetStoreItems.push(adAssetStore);
      // Save adAssetStore.
      await setAdAssetStore(adAssetStore.id, adAssetStore);
      logger.debug(`saved adAssetStore ${adAssetStore.id}`);
    }
    // save package to adAssetStore id list.
    if (adAssetStoreItems.length > 0) {
      const ids = adAssetStoreItems.map((item) => item.id);
      await setPackageToAdAssetStoreIds(packageName, ids);
      logger.info(
        `saved adAssetStore id list [${ids}] for package ${packageName}`,
      );
      return ids;
    }
  }
  return null;
}

/**
 * Searches asset store for a given keyword.
 * @param keyword The keyword to search for.
 * @returns The search result.
 */
export async function searchAssetStore(
  keyword: string,
): Promise<AssetStoreSearchResult> {
  const fullUrl = getSearchUrl(keyword);
  const refererUrl = getRefererUrl(keyword);
  const resp = await fetch(fullUrl, {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'sec-ch-ua':
        '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      Referer: refererUrl,
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    method: 'GET',
  });
  const result = (await resp.json()) as AssetStoreSearchResult;
  return result;
}

/**
 * Returns the search url for the keyword.
 * @param keyword The keyword to search for.
 * @returns The search url.
 */
export function getSearchUrl(keyword: string): string {
  const url = new URL(
    'https://api.assetstore.unity3d.com/affiliate/link-maker-api/search',
  );
  const params = new URLSearchParams({
    q: keyword,
    page: '1',
    order_by: 'relevance',
    rows: config.adKeywordMaxLimit.toString(),
  });
  params.append('q', 'type:content');
  const fullUrl = `${url}?${params}`;
  return fullUrl;
}

/**
 * Returns the referer url for the search url.
 * @param keyword The keyword to search for.
 * @returns The referer url.
 */
function getRefererUrl(keyword: string): string {
  const url = new URL(
    'https://api.assetstore.unity3d.com/affiliate/link-maker/index',
  );
  const params = new URLSearchParams({
    q: keyword,
    type: 'packages',
  });
  const fullUrl = `${url}?${params}`;
  return fullUrl;
}
