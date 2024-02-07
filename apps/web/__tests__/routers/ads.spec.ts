/* eslint-disable jest/expect-expect */
import request from 'supertest';

import redis from '@openupm/server-common/build/redis.js';

import { app } from '../../src/apiServer.js';
import {
  getRedisKeyForAdAssetStore,
  getRedisKeyForPackageToAdAssetStoreIds,
  setAdAssetStore,
  setPackageToAdAssetStoreIds,
} from '@openupm/ads/build/models';
import { AdAssetStore } from '@openupm/types';
import { convertAdAssetStoreToAdPlacementData } from '@openupm/ads/build/utils/convert';

const SAMPLE_PACKAGE_NAME = 'sample-package';
const SAMPLE_AD_ASSET_STORE_ID = '1234';
// const SAMPLE_AI_SLUG = 'ai';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, () => {
    beforeEach(async () => {
      await app.ready();
    });

    afterEach(async () => {
      await redis.client!.del(
        getRedisKeyForPackageToAdAssetStoreIds(SAMPLE_PACKAGE_NAME),
      );
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

describeWithRedis('/ads/custom', () => {
  it('should return 200', async () => {
    const response = await request(app.server)
      .get('/ads/custom')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    expect(response.body).not.toBeNull();
    expect(response.body).toEqual({ active: false });
  });
});

describeWithRedis('/ads/pkg/:pkgName', () => {
  it('should return 200', async () => {
    const adAssetStore: AdAssetStore = {
      id: SAMPLE_AD_ASSET_STORE_ID,
      slug: 'sample-asset',
      title: 'an asset',
      icon: 'http://example.com/image.png',
      image: 'http://example.com/image.png',
      price: 'free',
      category: 'blar/blar',
    };
    await setAdAssetStore(adAssetStore.id, adAssetStore);
    await setPackageToAdAssetStoreIds(SAMPLE_PACKAGE_NAME, [adAssetStore.id]);
    const response = await request(app.server)
      .get('/ads/pkg/' + SAMPLE_PACKAGE_NAME)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    const adPlacementData = convertAdAssetStoreToAdPlacementData(adAssetStore);
    expect(response.body).not.toBeNull();
    expect(response.body).toEqual([adPlacementData]);
  });
});
