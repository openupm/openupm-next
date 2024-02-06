import config from 'config';
import fetch, { AbortError } from 'node-fetch';
import { AbortController } from 'abort-controller';
import { Logger } from 'ts-log';
import { pRateLimit } from 'p-ratelimit/build/src/rateLimit.js';

import {
  AssetStorePackage,
  AssetStoreSearchResult,
} from '../types/assetStore.js';
import { setAdAssetStore } from '../models/adAssetStore.js';
import { convertAssetStorePackageToAdAssetStore } from './convert.js';

const searchAssetStoreRateLimit = pRateLimit(config.searchAssetStoreRateLimit);
const searchAssetStoreTimeout = 10 * 1000; // ms

/**
 * Searches asset store for given keywords, and return the saved ad-assetstore id list.
 * @param keywords The keywords to search for.
 * @param limit The maximum number of ad-assetstore ids to return.
 * @returns The ad-assetstore id list.
 */
export async function fetchAdAssetStoreListForKeywords(
  keywords: string[],
  limit: number,
  logger: Logger,
): Promise<string[]> {
  // fetch ad-assetstore list for given keywords.
  const adAssetStoreIds: string[] = [];
  for (const keyword of keywords) {
    // Search asset store for the keyword.
    const result = await searchAssetStoreRateLimit(() =>
      searchAssetStore(keyword),
    );
    // Sort result by hotness descending.
    const assetStorePackages: AssetStorePackage[] = result.results
      .sort((a, b) => {
        return parseFloat(b.hotness) - parseFloat(a.hotness);
      })
      // Filter out free packages.
      .filter((assetStorePackage) => {
        return assetStorePackage.price_usd !== '0.00';
      });
    logger.info(
      `found ${assetStorePackages.length} paid adAssetStores for keyword '${keyword}'`,
    );
    // Convert search result to adAssetStore and save it.
    for (const AssetStorePackage of assetStorePackages) {
      const adAssetStore =
        convertAssetStorePackageToAdAssetStore(AssetStorePackage);
      await setAdAssetStore(adAssetStore.id, adAssetStore);
      logger.debug(`saved adAssetStore ${adAssetStore.id}`);
      // Add the id to adAssetStoreIds.
      adAssetStoreIds.push(adAssetStore.id);
    }
    // Break if the list is full.
    if (adAssetStoreIds.length >= limit) break;
  }
  return adAssetStoreIds.slice(0, limit);
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
  // Timeout and abort controller.
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, searchAssetStoreTimeout);
  try {
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
      signal: controller.signal,
    });
    const result = (await resp.json()) as AssetStoreSearchResult;
    return result;
  } catch (err) {
    // If the error is an abort error, throw a timeout error.
    if (err instanceof AbortError) {
      throw new Error(`searchAssetStore timeout for keyword ${keyword}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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
