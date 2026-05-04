import { afterEach, describe, expect, it, vi } from 'vitest';

import { pingHealthcheck } from '../src/healthchecks.js';

describe('pingHealthcheck', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('skips empty ping urls', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    await pingHealthcheck('', 'success');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pings start, success, and fail endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await pingHealthcheck('https://hc.example/ping/id', 'start');
    await pingHealthcheck('https://hc.example/ping/id/', 'success');
    await pingHealthcheck('https://hc.example/ping/id', 'fail');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://hc.example/ping/id/start',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://hc.example/ping/id',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://hc.example/ping/id/fail',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('does not throw when the ping fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const logger = { warn: vi.fn() };

    await expect(
      pingHealthcheck('https://hc.example/ping/id', 'success', logger),
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});
