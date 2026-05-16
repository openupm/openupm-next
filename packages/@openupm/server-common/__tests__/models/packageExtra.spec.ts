import redis from '../../src/redis.js';
import {
  getRedisKeyForPackageExtra,
  getInvalidTags,
  getReadmeUpdatedAt,
  getRepoArchived,
  setInvalidTags,
  setReadmeUpdatedAt,
  setRepoArchived,
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

describeWithRedis('getReadmeUpdatedAt', () => {
  it('returns null when package has no README update timestamp', async () => {
    const val = await getReadmeUpdatedAt('package-not-existed');
    expect(val).toEqual(null);
  });

  it('sets and gets README update timestamp', async () => {
    await setReadmeUpdatedAt(SAMPLE_PACKAGE_NAME, 1767225600000);
    const result = await getReadmeUpdatedAt(SAMPLE_PACKAGE_NAME);
    expect(result).toEqual(1767225600000);
  });
});

describeWithRedis('getRepoArchived', () => {
  it('returns false when package has no archived flag', async () => {
    const val = await getRepoArchived('package-not-existed');
    expect(val).toEqual(false);
  });

  it('sets and gets archived flag', async () => {
    await setRepoArchived(SAMPLE_PACKAGE_NAME, true);
    expect(await getRepoArchived(SAMPLE_PACKAGE_NAME)).toEqual(true);

    await setRepoArchived(SAMPLE_PACKAGE_NAME, false);
    expect(await getRepoArchived(SAMPLE_PACKAGE_NAME)).toEqual(false);
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
