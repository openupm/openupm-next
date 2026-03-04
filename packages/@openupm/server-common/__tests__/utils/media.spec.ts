import { vi } from 'vitest';

const { hgetallMock } = vi.hoisted(() => ({
  hgetallMock: vi.fn(async () => ({})),
}));

vi.mock('../../src/redis.js', () => ({
  default: {
    client: {
      hgetall: hgetallMock,
    },
  },
}));
import { getImage } from '../../src/utils/media.js';

describe('getImage()', function () {
  it('non-existed url', async function () {
    const result = await getImage('non-existed-url', 50, 50, 'cover');
    expect(result).toBeNull();
    expect(hgetallMock).toHaveBeenCalledTimes(1);
  });
});
