import { AdAssetStore } from '@openupm/types';
import redis from '@openupm/server-common/build/redis.js';

import {
  getAdAssetStore,
  getRedisKeyForAdAssetStore,
  setAdAssetStore,
} from '../../src/models/adAssetStore.js';

const SAMPLE_AD_ASSET_STORE_ID = 'sample-asset-store-id';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, () => {
    afterEach(async () => {
      await redis.client!.del(
        getRedisKeyForAdAssetStore(SAMPLE_AD_ASSET_STORE_ID),
      );
    });

    afterAll(async () => {
      await redis.close();
    });

    fn();
  });
}

describeWithRedis('ad assetstore', () => {
  it('ad-assetstore not existed', async () => {
    const val = await getAdAssetStore('ad-assetstore-not-existed');
    expect(val).toBeNull();
  });

  it('set and get an ad assetstore', async () => {
    const data: AdAssetStore = {
      id: '1234',
      slug: '1234',
      title: 'an asset',
      icon: 'http://example.com/image.png',
      image: 'http://example.com/image.png',
      originalPrice: '0.00',
      price: '0.00',
      category: 'blar/blar',
      ratingAverage: 0,
      ratingCount: null,
      publisher: 'publisher',
    };
    await setAdAssetStore(SAMPLE_AD_ASSET_STORE_ID, data);
    const result = await getAdAssetStore(SAMPLE_AD_ASSET_STORE_ID);
    expect(result).toEqual(data);
  });
});
