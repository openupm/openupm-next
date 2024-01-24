import config from 'config';

import { AdAssetStore, AdPlacementData } from '@openupm/types';

/**
 * Gets the URL for an AdAssetStore.
 * @param adAssetStore The AdAssetStore object.
 * @returns The URL for the AdAssetStore.
 * @throws Error if config.unityAffiliateId is not defined.
 */
function getUrlForAdAssetStore(adAssetStore: AdAssetStore): string {
  const aid = config.unityAffiliateId;
  if (aid === undefined)
    throw new Error('config.unityAffiliateId is not defined');
  return `https://prf.hn/click/camref:${aid}/destination:https://assetstore.unity.com/packages/slug/${adAssetStore.slug}`;
}

/**
 * Converts an AdAssetStore object to AdPlacementData.
 * @param adAssetStore The AdAssetStore object to convert.
 * @returns The converted AdPlacementData object.
 */
export function convertAdAssetStoreToAdPlacementData(
  adAssetStore: AdAssetStore,
): AdPlacementData {
  const obj: AdPlacementData = {
    title: adAssetStore.title,
    image: adAssetStore.image || adAssetStore.image2 || '',
    price: adAssetStore.price,
    url: getUrlForAdAssetStore(adAssetStore),
  };
  return obj;
}
