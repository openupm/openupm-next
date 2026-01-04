import redis from '../../src/redis.js';
import {
  getRedisKeyForPackageExtra,
  getInvalidTags,
  setInvalidTags,
  getPropKeyForLang,
} from '../../src/models/packageExtra.js';

const SAMPLE_PACKAGE_NAME = 'sample-package';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, () => {
    afterEach(async () => {
      await redis.client!.del(getRedisKeyForPackageExtra(SAMPLE_PACKAGE_NAME));
    });

    afterAll(async () => {
      await redis.close();
    });

    fn();
  });
}

describeWithRedis('getInvalidTags', () => {
  it('package not existed', async () => {
    const val = await getInvalidTags('package-not-existed');
    expect(val).toEqual([]);
  });

  it('set and get', async () => {
    const invalidTags = [
      { commit: '22eab65', tag: '1.0' },
      { commit: '7d8f7e8', tag: '2.0' },
    ];
    await setInvalidTags(SAMPLE_PACKAGE_NAME, invalidTags);
    const result = await getInvalidTags(SAMPLE_PACKAGE_NAME);
    expect(result).toEqual(invalidTags);
  });
});

describe('getPropKeyForLang', () => {
  it('en-US', () => {
    const val = getPropKeyForLang('name', 'en-US');
    expect(val).toEqual('name');
  });

  it('undefined', () => {
    const val = getPropKeyForLang('name');
    expect(val).toEqual('name');
  });

  it('empty string', () => {
    const val = getPropKeyForLang('name', '');
    expect(val).toEqual('name');
  });

  it('unsupported lang', () => {
    expect(() => {
      getPropKeyForLang('name', 'unsupported-lang');
    }).toThrow();
  });
});
