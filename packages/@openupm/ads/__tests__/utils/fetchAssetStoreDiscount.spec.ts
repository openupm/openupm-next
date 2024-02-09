import { parseAssetStoreFinalPrice } from '../../src/utils/fetchAssetStoreDiscount.js';

describe('parseAssetStoreFinalPrice', function () {
  it('should parse discount', () => {
    const content =
      'originalPrice: { itemId: "0001", originalPrice: "54.99", finalPrice: "27.49"},';
    const result = parseAssetStoreFinalPrice(content);
    expect(result).toEqual('27.49');
  });

  it('should return null if if content is empty', () => {
    const content = '';
    const result = parseAssetStoreFinalPrice(content);
    expect(result).toBeNull();
  });

  it('should return 0.00 if finalPrice is free', () => {
    const content =
      'originalPrice: { itemId: "0001", originalPrice: "54.99", finalPrice: "FREE"},';
    const result = parseAssetStoreFinalPrice(content);
    expect(result).toEqual('0.00');
  });
});
