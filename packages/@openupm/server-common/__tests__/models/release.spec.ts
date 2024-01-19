import redis from '../../src/redis.js';
import {
  fetchAll,
  fetchOne,
  fetchOneOrThrow,
  getRedisKeyForRelease,
  remove,
  save,
} from '../../src/models/release.js';

const SAMPLE_PACKAGE_NAME = 'sample-package';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, function () {
    afterEach(async () => {
      await redis.client!.del(getRedisKeyForRelease(SAMPLE_PACKAGE_NAME));
    });

    afterAll(async () => {
      await redis.close();
    });

    fn();
  });
}

describeWithRedis('save', function () {
  it('should throw for empty packageName', async () => {
    await expect(async () => {
      await save({
        packageName: '',
        version: '1.0.0',
      });
    }).rejects.toThrow();
  });

  it('should throw for empty version', async () => {
    await expect(async () => {
      await save({
        packageName: SAMPLE_PACKAGE_NAME,
        version: '',
      });
    }).rejects.toThrow();
  });

  it('save empty', async () => {
    const obj = await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
    });
    expect(obj.packageName).toEqual(SAMPLE_PACKAGE_NAME);
    expect(obj.version).toEqual('1.0.0');
    expect(obj.createdAt).toBeGreaterThan(0);
    expect(obj.updatedAt).toBeGreaterThan(0);
    expect(obj.state).toEqual(0);
    expect(obj.reason).toEqual(0);
    expect(obj.buildId).toEqual('');
  });

  it('save and remove', async () => {
    const obj = await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      commit: '23abc5f',
      tag: 'upm/1.0.0',
      state: 1,
      reason: 800,
      buildId: '123',
      createdAt: 0,
      updatedAt: 0,
    });
    const obj2 = await fetchOne(obj.packageName, obj.version);
    expect(obj2).not.toBeNull();
    expect(obj2!.buildId).toEqual(obj.buildId);
    expect(obj2!.tag).toEqual(obj.tag);
    expect(obj2!.commit).toEqual(obj.commit);
    expect(obj2!.state).toEqual(obj.state);
    expect(obj2!.reason).toEqual(obj.reason);
    await remove(obj2!.packageName, obj2!.version);
    const obj3 = await fetchOne(obj.packageName, obj.version);
    expect(obj3).toBeNull();
  });
});

describeWithRedis('fetchOneOrThrow', function () {
  it('should throw for non-existed package', async () => {
    await expect(
      fetchOneOrThrow('not-exist-package', '1.0.0'),
    ).rejects.toThrow();
  });
});

describeWithRedis('fetchAll', function () {
  it('should fetch all', async () => {
    const obj1 = await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
    });
    expect(obj1).not.toBeNull();
    const obj2 = await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.1',
    });
    expect(obj2).not.toBeNull();
    const objs = await fetchAll(SAMPLE_PACKAGE_NAME);
    const versions = objs.map((x) => x.version).sort();
    expect(versions).toEqual([obj1.version, obj2.version]);
  });
});
