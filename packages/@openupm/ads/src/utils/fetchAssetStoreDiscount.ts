import config from 'config';
import fetch, { AbortError } from 'node-fetch';
import { AbortController } from 'abort-controller';
import { pRateLimit } from 'p-ratelimit/build/src/rateLimit.js';

const fetchLinkerMakerEmbedRateLimit = pRateLimit(
  config.fetchLinkerMakerEmbedRateLimit,
);
const fetchLinkmakerEmbedTimeout = 10 * 1000; // ms

/**
 * Fetch the asset store final price for the given AssetStorePackage id.
 * @param id The AssetStorePackage id.
 * @returns The asset store price.
 */
export async function fetchAssetStoreFinalPrice(
  id: string,
): Promise<string | null> {
  const content = await fetchLinkerMakerEmbedRateLimit(() =>
    fetchLinkmakerEmbed(id),
  );
  return parseAssetStoreFinalPrice(content);
}

/**
 * Parse asset store final price from the given page content.
 * @param content The page content.
 * @returns The asset store price.
 */
export function parseAssetStoreFinalPrice(content: string): string | null {
  const finalPriceMatch = content.match(/finalPrice: "([^"]*)"/);
  if (!finalPriceMatch) return null;
  const finalPriceStr = finalPriceMatch[1].toLocaleLowerCase();
  if (finalPriceStr === 'free') return '0.00';
  const finalPriceNum = parseFloat(finalPriceStr);
  if (isNaN(finalPriceNum)) return null;
  return finalPriceStr;
}

/**
 * Fetch linkmaker embed page for the given AssetStorePackage id.
 * @param id The AssetStorePackage id.
 * @returns The page content.
 */
export async function fetchLinkmakerEmbed(id: string): Promise<string> {
  const fullUrl = getLinkmakerEmbedUrl(id);
  const refererUrl = getRefererUrl();
  // Timeout and abort controller.
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, fetchLinkmakerEmbedTimeout);
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
    const result = await resp.text();
    return result;
  } catch (err) {
    // If the error is an abort error, throw a timeout error.
    if (err instanceof AbortError) {
      throw new Error(`fetchLinkmakerEmbed timeout for id ${id}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Returns the linkmaker embed URL for the given AssetStorePackage id.
 * @param id The AssetStorePackage id.
 * @returns The linkmaker embed URL.
 */
export function getLinkmakerEmbedUrl(id: string): string {
  const url = new URL(
    `https://assetstore.unity.com/linkmaker/embed/package/${id}/widget/notrack`,
  );
  const fullUrl = `${url}`;
  return fullUrl;
}

/**
 * Returns the referer URL for the linkmaker embed request.
 * @returns The referer URL.
 */
function getRefererUrl(): string {
  const url = new URL(
    'https://api.assetstore.unity3d.com/affiliate/link-maker/index',
  );
  const fullUrl = `${url}`;
  return fullUrl;
}
