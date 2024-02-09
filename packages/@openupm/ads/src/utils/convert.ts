import config from 'config';

import { AdAssetStore, AdPlacementData } from '@openupm/types';
import { AssetStorePackage } from '../types/assetStore.js';

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
    image: adAssetStore.image || '',
    // Add currency symbol to originalPrice
    originalPrice:
      adAssetStore.originalPrice === '0.00'
        ? 'Free'
        : '$' + adAssetStore.originalPrice,
    // Add currency symbol to price
    price: adAssetStore.price === '0.00' ? 'Free' : '$' + adAssetStore.price,
    url: getUrlForAdAssetStore(adAssetStore),
    ratingAverage: adAssetStore.ratingAverage || 0,
    ratingCount: adAssetStore.ratingCount || null,
    publisher: adAssetStore.publisher || '',
  };
  // Fix old data that originalPrice can be undefined.
  if (!adAssetStore.originalPrice) obj.originalPrice = obj.price;
  return obj;
}

/**
 * Converts an AssetStorePackage object to AdAssetStore.
 * @param assetStorePackage The AssetStorePackage object to convert.
 * @returns The converted AdAssetStore object.
 */
export function convertAssetStorePackageToAdAssetStore(
  assetStorePackage: AssetStorePackage,
): AdAssetStore {
  const obj: AdAssetStore = {
    id: assetStorePackage.id,
    slug: assetStorePackage.slug,
    title: assetStorePackage.title_english || assetStorePackage.title,
    category: assetStorePackage.category.slug_v2,
    image:
      assetStorePackage.keyimage.big_v2 ||
      assetStorePackage.keyimage.big ||
      assetStorePackage.keyimage.medium ||
      assetStorePackage.keyimage.medium ||
      '',
    icon: assetStorePackage.icon || assetStorePackage.keyimage.icon || '',
    originalPrice: assetStorePackage.price_usd,
    price: assetStorePackage.price_usd,
    ratingAverage: assetStorePackage.rating.average || 0,
    ratingCount: assetStorePackage.rating.count || null,
    publisher: assetStorePackage.publisher.label_english || '',
  };
  return obj;
}
