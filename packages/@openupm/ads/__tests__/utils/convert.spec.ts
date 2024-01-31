import config from 'config';
import {
  convertAdAssetStoreToAdPlacementData,
  convertAssetStorePackageToAdAssetStore,
} from '../../src/utils/convert.js';
import { AssetStorePackage } from '../../src/types/assetStore';

describe('convertAdAssetStoreToAdPlacementData', function () {
  it('should convert AdAssetStore to AdPlacementData', async function () {
    const result = convertAdAssetStoreToAdPlacementData({
      id: 'id',
      slug: 'slug',
      title: 'title',
      category: 'category',
      image: 'image',
      icon: 'icon',
      price: 'price',
    });
    expect(result).toEqual({
      title: 'title',
      image: 'image',
      price: 'price',
      url: `https://prf.hn/click/camref:${config.unityAffiliateId}/destination:https://assetstore.unity.com/packages/slug/slug`,
    });
  });
});

describe('convertAssetStorePackageToAdAssetStore', () => {
  it('should convert AssetStorePackage to AdAssetStore', () => {
    const assetStorePackage: Partial<AssetStorePackage> = {
      id: '1',
      slug: 'example-slug',
      title: 'Example Title',
      category: {
        slug_v2: 'example-category',
        label_english: '',
        multiple: '',
        id: '',
        label: '',
      },
      keyimage: {
        big_legacy: '',
        big_v2: 'example-image-url',
        big: '',
        facebook: '',
        icon: '',
        icon25: '',
        icon75: '',
        medium: '',
        small_legacy: '',
        small_v2: '',
        small: '',
      },
      icon: 'example-icon-url',
      price_usd: '9.99',
    };
    const expectedAdAssetStore = {
      id: '1',
      slug: 'example-slug',
      title: 'Example Title',
      category: 'example-category',
      image: 'example-image-url',
      icon: 'example-icon-url',
      price: '9.99',
    };
    const result = convertAssetStorePackageToAdAssetStore(
      assetStorePackage as AssetStorePackage,
    );
    expect(result).toEqual(expectedAdAssetStore);
  });
});
