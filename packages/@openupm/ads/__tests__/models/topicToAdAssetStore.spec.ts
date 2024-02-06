import redis from '@openupm/server-common/build/redis.js';

import {
  getTopicToAdAssetStoreIds,
  getRedisKeyForTopicToAdAssetStoreIds,
  setTopicToAdAssetStoreIds,
} from '../../src/models/topicToAdAssetStoreIds.js';

const SAMPLE_TOPIC_SLUG = 'ai';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, () => {
    afterEach(async () => {
      await redis.client!.del(
        getRedisKeyForTopicToAdAssetStoreIds(SAMPLE_TOPIC_SLUG),
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
    const val = await getTopicToAdAssetStoreIds('package-not-existed');
    expect(val).toEqual([]);
  });

  it('set and get an ad package to assetstore', async () => {
    const ids = ['0000', '0001'];
    await setTopicToAdAssetStoreIds(SAMPLE_TOPIC_SLUG, ids);
    const result = await getTopicToAdAssetStoreIds(SAMPLE_TOPIC_SLUG);
    expect(result).toEqual(ids);
  });
});
