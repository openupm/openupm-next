import { jest } from '@jest/globals';

const hgetallMock = jest.fn(async () => ({}));

jest.unstable_mockModule('../../src/redis.js', () => ({
  default: {
    get client() {
      return {
        hgetall: hgetallMock,
      };
    },
  },
}));

const { getImage } = await import('../../src/utils/media.js');

describe('getImage()', function () {
  it('non-existed url', async function () {
    const result = await getImage('non-existed-url', 50, 50, 'cover');
    expect(result).toBeNull();
    expect(hgetallMock).toHaveBeenCalledTimes(1);
  });
});
