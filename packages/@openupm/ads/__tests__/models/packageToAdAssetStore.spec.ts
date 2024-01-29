import redis from '@openupm/server-common/build/redis.js';

import {
  getPackageToAdAssetStoreIds,
  getRedisKeyForPackageToAdAssetStoreIds,
  setPackageToAdAssetStoreIds,
} from '../../src/models/packageToAdAssetStoreIds.js';

const SAMPLE_PACKAGE_NAME = 'sample-package';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, () => {
    afterEach(async () => {
      await redis.client!.del(
        getRedisKeyForPackageToAdAssetStoreIds(SAMPLE_PACKAGE_NAME),
      );
    });

    afterAll(async () => {
      await redis.close();
    });

    fn();
  });
}

describeWithRedis('ad package to assetstore', () => {
  it('package not existed', async () => {
    const val = await getPackageToAdAssetStoreIds('package-not-existed');
    expect(val).toEqual([]);
  });

  it('set and get an ad package to assetstore', async () => {
    const ids = ['0000', '0001'];
    await setPackageToAdAssetStoreIds(SAMPLE_PACKAGE_NAME, ids);
    const result = await getPackageToAdAssetStoreIds(SAMPLE_PACKAGE_NAME);
    expect(result).toEqual(ids);
  });
});
