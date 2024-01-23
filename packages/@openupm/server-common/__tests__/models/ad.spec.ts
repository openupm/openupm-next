import { AdAssetStore } from '@openupm/types';
import redis from '../../src/redis.js';
import {
  getAdAssetStore,
  getAdPackageToAssetStore,
  getRedisKeyForAdAssetStore,
  getRedisKeyForAdPackageToAssetStore,
  setAdAssetStore,
  setAdPackageToAssetStore,
} from '../../src/models/ad.js';

const SAMPLE_AD_ASSET_STORE_ID = 'sample-asset-store-id';
const SAMPLE_PACKAGE_NAME = 'sample-package';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, () => {
    afterEach(async () => {
      await redis.client!.del(
        getRedisKeyForAdAssetStore(SAMPLE_AD_ASSET_STORE_ID),
      );
      await redis.client!.del(
        getRedisKeyForAdPackageToAssetStore(SAMPLE_PACKAGE_NAME),
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
      image2: 'http://example.com/image.png',
      price: 'free',
      category: 'blar/blar',
    };
    await setAdAssetStore(SAMPLE_AD_ASSET_STORE_ID, data);
    const result = await getAdAssetStore(SAMPLE_AD_ASSET_STORE_ID);
    expect(result).toEqual(data);
  });
});

describeWithRedis('ad package to assetstore', () => {
  it('package not existed', async () => {
    const val = await getAdPackageToAssetStore('package-not-existed');
    expect(val).toEqual([]);
  });

  it('set and get an ad package to assetstore', async () => {
    const data = ['0000', '0001'];
    await setAdPackageToAssetStore(SAMPLE_PACKAGE_NAME, data);
    const result = await getAdPackageToAssetStore(SAMPLE_PACKAGE_NAME);
    expect(result).toEqual(data);
  });
});
