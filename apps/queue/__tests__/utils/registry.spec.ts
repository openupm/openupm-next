import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  accept: vi.fn(),
  get: vi.fn(),
  timeout: vi.fn(),
}));

vi.mock('superagent', () => ({
  default: {
    get: mocks.get,
  },
}));

describe('isReleasePublished', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.get.mockReturnValue({ accept: mocks.accept });
    mocks.accept.mockReturnValue({ timeout: mocks.timeout });
  });

  it('finds the exact version in the registry packument', async () => {
    mocks.timeout.mockResolvedValue({
      body: {
        name: 'com.foo.bar',
        versions: {
          '1.2.3': {
            name: 'com.foo.bar',
            version: '1.2.3',
          },
          '1.2.4': {
            name: 'com.foo.bar',
            version: '1.2.4',
          },
        },
      },
    });
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(isReleasePublished('com.foo.bar', '1.2.3')).resolves.toBe(
      true,
    );
    await expect(isReleasePublished('com.foo.bar', '2.0.0')).resolves.toBe(
      false,
    );

    expect(mocks.get).toHaveBeenCalledWith(
      'https://package.openupm.com/com.foo.bar',
    );
    expect(mocks.timeout).toHaveBeenCalledWith(10000);
  });

  it('treats a missing packument as unpublished', async () => {
    mocks.timeout.mockRejectedValue({ status: 404 });
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(
      isReleasePublished('com.missing.package', '1.0.0'),
    ).resolves.toBe(false);
  });

  it('preserves transient registry errors', async () => {
    const error = Object.assign(new Error('unavailable'), { status: 503 });
    mocks.timeout.mockRejectedValue(error);
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(isReleasePublished('com.foo.bar', '1.2.3')).rejects.toBe(
      error,
    );
  });

  it('rejects a malformed successful registry response', async () => {
    mocks.timeout.mockResolvedValue({
      body: {
        name: 'com.foo.bar',
      },
    });
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(isReleasePublished('com.foo.bar', '1.2.3')).rejects.toThrow(
      'Registry returned an invalid packument for com.foo.bar',
    );
  });

  it('rejects a packument for the wrong package', async () => {
    mocks.timeout.mockResolvedValue({
      body: {
        name: 'com.other.package',
        versions: {
          '1.2.3': {
            name: 'com.other.package',
            version: '1.2.3',
          },
        },
      },
    });
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(isReleasePublished('com.foo.bar', '1.2.3')).rejects.toThrow(
      'Registry returned an invalid packument for com.foo.bar',
    );
  });

  it('rejects a malformed exact-version manifest', async () => {
    mocks.timeout.mockResolvedValue({
      body: {
        name: 'com.foo.bar',
        versions: {
          '1.2.3': null,
        },
      },
    });
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(isReleasePublished('com.foo.bar', '1.2.3')).rejects.toThrow(
      'Registry returned an invalid manifest for com.foo.bar@1.2.3',
    );
  });

  it('rejects a mismatched exact-version manifest', async () => {
    mocks.timeout.mockResolvedValue({
      body: {
        name: 'com.foo.bar',
        versions: {
          '1.2.3': {
            name: 'com.foo.bar',
            version: '9.9.9',
          },
        },
      },
    });
    const { isReleasePublished } = await import('../../src/utils/registry.js');

    await expect(isReleasePublished('com.foo.bar', '1.2.3')).rejects.toThrow(
      'Registry returned an invalid manifest for com.foo.bar@1.2.3',
    );
  });
});
