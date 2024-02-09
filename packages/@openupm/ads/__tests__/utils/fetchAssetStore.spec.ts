import nock from 'nock';
import { Logger } from 'ts-log';

import { updateFinalPrice } from '../../src/utils/fetchAssetStore.js';
import { getLinkmakerEmbedUrl } from '../../src/utils/fetchAssetStoreDiscount';
import { AdAssetStore } from '../../../types/build';
import { mock } from 'ts-mockito';

// Mock linkmaker embed response content.
function mockLinkmakerEmbedContent(finalPrice: string) {
  return `originalPrice: { itemId: "...", originalPrice: "...", finalPrice: "${finalPrice}"},`;
}

describe('updateFinalPrice', function () {
  beforeEach(() => {
    if (!nock.isActive()) nock.activate();
  });

  afterEach(async () => {
    nock.restore();
  });

  it('should update final price', async () => {
    const adAssetStore: AdAssetStore = {
      id: '0001',
      slug: 'sample-asset',
      title: 'an asset',
      icon: 'http://example.com/image.png',
      image: 'http://example.com/image.png',
      originalPrice: '10.00',
      price: '10.00',
      category: 'blar/blar',
      ratingAverage: 0,
      ratingCount: null,
      publisher: 'publisher',
    };
    const originalPrice = adAssetStore.price;
    const finalPrice = '5.00';
    // Mock the linkmaker embed request
    const linkmakerEmbedUrl1 = new URL(getLinkmakerEmbedUrl(adAssetStore.id));
    nock(linkmakerEmbedUrl1.origin)
      .get(linkmakerEmbedUrl1.pathname)
      .query(true)
      .reply(200, mockLinkmakerEmbedContent(finalPrice));
    // Mock the logger
    const mockLogger = mock<Logger>();
    // Test the function
    await updateFinalPrice(adAssetStore, mockLogger);
    expect(adAssetStore.price).toEqual(finalPrice);
    expect(adAssetStore.originalPrice).toEqual(originalPrice);
  });

  it('should not update final price if linkmaker embed page is empty', async () => {
    const adAssetStore: AdAssetStore = {
      id: '0001',
      slug: 'sample-asset',
      title: 'an asset',
      icon: 'http://example.com/image.png',
      image: 'http://example.com/image.png',
      originalPrice: '10.00',
      price: '10.00',
      category: 'blar/blar',
      ratingAverage: 0,
      ratingCount: null,
      publisher: 'publisher',
    };
    const originalPrice = adAssetStore.price;
    const finalPrice = originalPrice;
    // Mock the linkmaker embed request
    const linkmakerEmbedUrl1 = new URL(getLinkmakerEmbedUrl(adAssetStore.id));
    nock(linkmakerEmbedUrl1.origin)
      .get(linkmakerEmbedUrl1.pathname)
      .query(true)
      .reply(200, '');
    // Mock the logger
    const mockLogger = mock<Logger>();
    // Test the function
    await updateFinalPrice(adAssetStore, mockLogger);
    expect(adAssetStore.price).toEqual(finalPrice);
    expect(adAssetStore.originalPrice).toEqual(originalPrice);
  });

  it('should not update final price if linkmaker embed page request get an error', async () => {
    const adAssetStore: AdAssetStore = {
      id: '0001',
      slug: 'sample-asset',
      title: 'an asset',
      icon: 'http://example.com/image.png',
      image: 'http://example.com/image.png',
      originalPrice: '10.00',
      price: '10.00',
      category: 'blar/blar',
      ratingAverage: 0,
      ratingCount: null,
      publisher: 'publisher',
    };
    const originalPrice = adAssetStore.price;
    const finalPrice = originalPrice;
    // Mock the linkmaker embed request
    const linkmakerEmbedUrl1 = new URL(getLinkmakerEmbedUrl(adAssetStore.id));
    nock(linkmakerEmbedUrl1.origin)
      .get(linkmakerEmbedUrl1.pathname)
      .query(true)
      .reply(404, 'FAILED!');
    // Mock the logger
    const mockLogger = mock<Logger>();
    // Test the function
    await updateFinalPrice(adAssetStore, mockLogger);
    expect(adAssetStore.price).toEqual(finalPrice);
    expect(adAssetStore.originalPrice).toEqual(originalPrice);
  });
});
