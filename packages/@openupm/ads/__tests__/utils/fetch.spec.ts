import nock from 'nock';
import { Logger } from 'ts-log';
import { mock } from 'ts-mockito';
import redis from '@openupm/server-common/build/redis.js';

import {
  getRedisKeyForAdAssetStore,
  getRedisKeyForPackageToAdAssetStoreIds,
} from '../../src/models/index.js';
import {
  fetchPackageToAdAssetStoreIds,
  getSearchUrl,
} from '../../src/utils/fetch.js';
import {
  AssetStoreSearchResult,
  AssetStorePackage,
} from '../../src/types/assetStore.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockAssetStorePackage(initials: any): AssetStorePackage {
  const obj = {
    pubdate: '2020-01-01',
    rating: {
      count: 100,
      average: 3.5,
    },
    pubdate_iso: '2020-01-01T00:00:00.000Z',
    kategory: {
      name: 'Editor Extensions',
      slug: 'editor-extensions',
      id: '1',
    },
    weight: 100,
    package_version_id: '000001',
    slug: 'slug',
    hotness: '100.2',
    id: '000001',
    category: {
      label_english: 'Editor Extensions',
      slug_v2: 'editor-extensions',
      multiple: 'false',
      id: '1',
      label: 'Editor Extensions',
    },
    publisher: {
      label_english: 'publisher1',
      slug: 'publisher1',
      url: 'https://example.com',
      id: '000001',
      support_email: 'support@example.com',
      support_url: 'https://example.com/support',
    },
    list: [],
    link: { id: '000001', type: 'package' },
    flags: {},
    version: '1.0.0',
    keyimage: {
      icon: '//example.com/icon.png',
      small: '//example.com/small.png',
      small_legacy: '//example.com/small_legacy.png',
      small_v2: '//example.com/small_v2.png',
      big_legacy: '//example.com/big_legacy.png',
      icon75: '//example.com/icon75.png',
      big: '//example.com/big.png',
      facebook: '//example.com/facebook.png',
      medium: '//example.com/medium.png',
      big_v2: '//example.com/big_v2.png',
      icon25: '//example.com/icon25.png',
    },
    price_usd: '0.01',
    title_english: 'pkg 1',
    title: 'pkg 1',
  };
  return { ...obj, ...initials };
}

const SAMPLE_PACKAGE_NAME = 'com.littlebigfun.addressable-importer';
const SAMPLE_ASSET_STORE_ID_1 = '000001';
const SAMPLE_ASSET_STORE_ID_2 = '000002';

describe('fetchPackageToAdAssetStoreIds', function () {
  beforeEach(() => {
    if (!nock.isActive()) nock.activate();
  });

  afterEach(async () => {
    nock.restore();
    await redis.client!.del(
      getRedisKeyForPackageToAdAssetStoreIds(SAMPLE_PACKAGE_NAME),
    );
    for (const assetStoreId of [
      SAMPLE_ASSET_STORE_ID_1,
      SAMPLE_ASSET_STORE_ID_2,
    ]) {
      await redis.client!.del(getRedisKeyForAdAssetStore(assetStoreId));
    }
  });

  afterAll(async () => {
    await redis.close();
  });

  it('should fetch package to ad asset store ids', async () => {
    // Mock the network request
    const packageName = SAMPLE_PACKAGE_NAME;
    const keyword = 'addressable';
    // Mock the network request using nock and ts-mockito
    const searchUrl = getSearchUrl(keyword);
    const url = new URL(searchUrl);
    const package1 = mockAssetStorePackage({
      id: SAMPLE_ASSET_STORE_ID_1,
      slug: 'pkg1',
      hotness: '5',
    });
    const package2 = mockAssetStorePackage({
      id: SAMPLE_ASSET_STORE_ID_2,
      slug: 'pkg2',
      hotness: '10',
    });
    const data: AssetStoreSearchResult = {
      results: [package1, package2],
      total: 2,
    };
    const mockResponseData = JSON.stringify(data);
    nock(url.origin).get(url.pathname).query(true).reply(200, mockResponseData);
    // Mock the logger
    const mockLogger = mock<Logger>();
    // Test the function
    const result = await fetchPackageToAdAssetStoreIds(packageName, mockLogger);
    expect(result).toEqual([package2.id, package1.id]);
  });
});
