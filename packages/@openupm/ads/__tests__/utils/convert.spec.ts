import config from 'config';
import { convertAdAssetStoreToAdPlacementData } from '../../src/utils/convert.js';

describe('convertAdAssetStoreToAdPlacementData', function () {
  it('should convert AdAssetStore to AdPlacementData', async function () {
    const result = convertAdAssetStoreToAdPlacementData({
      id: 'id',
      slug: 'slug',
      title: 'title',
      category: 'category',
      image: 'image',
      image2: 'image2',
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
  it('should use image2 if image is empty', async function () {
    const result = convertAdAssetStoreToAdPlacementData({
      id: 'id',
      slug: 'slug',
      title: 'title',
      category: 'category',
      image: '',
      image2: 'image2',
      icon: 'icon',
      price: 'price',
    });
    expect(result).toEqual({
      title: 'title',
      image: 'image2',
      price: 'price',
      url: `https://prf.hn/click/camref:${config.unityAffiliateId}/destination:https://assetstore.unity.com/packages/slug/slug`,
    });
  });
});
