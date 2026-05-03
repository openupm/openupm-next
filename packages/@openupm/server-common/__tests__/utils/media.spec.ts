import { vi } from 'vitest';

const { hgetallMock, hsetMock, hmsetMock } = vi.hoisted(() => ({
  hgetallMock: vi.fn(async () => ({})),
  hsetMock: vi.fn(),
  hmsetMock: vi.fn(),
}));

vi.mock('../../src/redis.js', () => ({
  default: {
    client: {
      hgetall: hgetallMock,
      hset: hsetMock,
      hmset: hmsetMock,
    },
  },
}));
vi.mock('@openupm/local-data', () => ({
  getLocalDataDir: () => '/tmp/openupm-test-data',
}));
import { addImage, getImage } from '../../src/utils/media.js';

describe('getImage()', function () {
  it('non-existed url', async function () {
    const result = await getImage('non-existed-url', 50, 50, 'cover');
    expect(result).toBeNull();
    expect(hgetallMock).toHaveBeenCalledTimes(1);
  });
});

describe('addImage()', function () {
  afterEach(function () {
    vi.unstubAllGlobals();
  });

  it('returns without redis updates when the image download fails', async function () {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404 })),
    );

    await addImage('https://example.com/missing.png', 50, 50, 'cover', 1000);

    expect(hsetMock).not.toHaveBeenCalled();
    expect(hmsetMock).not.toHaveBeenCalled();
  });
});
