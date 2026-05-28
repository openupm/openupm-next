import redis from '../../src/redis.js';
import {
  backfillRecentReleaseIndexes,
  fetchAll,
  fetchRecentReleases,
  fetchOne,
  fetchOneOrThrow,
  getRedisKeyForRecentReleases,
  getRedisKeyForRelease,
  remove,
  save,
} from '../../src/models/release.js';
import { ReleaseErrorCode, ReleaseState } from '@openupm/types';

const SAMPLE_PACKAGE_NAME = 'sample-package';

function describeWithRedis(name: string, fn: () => void): void {
  // eslint-disable-next-line jest/valid-title
  describe(name, function () {
    afterEach(async () => {
      await redis.client!.del(
        getRedisKeyForRelease(SAMPLE_PACKAGE_NAME),
        getRedisKeyForRelease('sample-package-two'),
        getRedisKeyForRecentReleases('succeeded'),
        getRedisKeyForRecentReleases('failed'),
      );
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
    expect(obj.source).toEqual('git');
    expect(obj.signed).toEqual(false);
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
      source: 'githubRelease',
      signed: true,
      publishedVersion: '1.0.1',
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
    expect(obj2!.source).toEqual('githubRelease');
    expect(obj2!.signed).toEqual(true);
    expect(obj2!.publishedVersion).toEqual('1.0.1');
    await remove(obj2!.packageName, obj2!.version);
    const obj3 = await fetchOne(obj.packageName, obj.version);
    expect(obj3).toBeNull();
  });

  it('tracks and clears GitHub Release pending probe metadata', async () => {
    const failed = await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      state: ReleaseState.Failed,
      reason: ReleaseErrorCode.GitHubReleaseNotFound,
    });
    expect(failed.githubReleaseAssetMissingFirstSeenAt).toBeGreaterThan(0);

    const firstSeenAt = failed.githubReleaseAssetMissingFirstSeenAt;
    const repeated = await save({
      ...failed,
      buildId: 'retry-build',
      reason: ReleaseErrorCode.GitHubReleaseAssetNotFound,
    });
    expect(repeated.githubReleaseAssetMissingFirstSeenAt).toEqual(firstSeenAt);

    const succeeded = await save({
      ...repeated,
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      githubReleaseAssetMissingLastProbeAt: Date.now(),
      githubReleaseAssetMissingProbeCount: 2,
    });
    expect(succeeded.githubReleaseAssetMissingFirstSeenAt).toBeUndefined();
    expect(succeeded.githubReleaseAssetMissingLastProbeAt).toBeUndefined();
    expect(succeeded.githubReleaseAssetMissingProbeCount).toBeUndefined();
  });
});

describeWithRedis('fetchRecentReleases', function () {
  it('indexes succeeded releases and removes them from the failed index', async () => {
    await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      state: ReleaseState.Failed,
    });
    const saved = await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      state: ReleaseState.Succeeded,
      source: 'githubRelease',
      signed: true,
    });

    expect(await fetchRecentReleases('failed', 20)).toEqual([]);
    expect(await fetchRecentReleases('succeeded', 20)).toMatchObject([
      {
        packageName: SAMPLE_PACKAGE_NAME,
        version: saved.version,
        state: ReleaseState.Succeeded,
        source: 'githubRelease',
        signed: true,
      },
    ]);
  });

  it('indexes failed releases and removes them from the succeeded index', async () => {
    await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      state: ReleaseState.Succeeded,
    });
    await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      state: ReleaseState.Failed,
    });

    expect(await fetchRecentReleases('succeeded', 20)).toEqual([]);
    expect(await fetchRecentReleases('failed', 20)).toMatchObject([
      {
        packageName: SAMPLE_PACKAGE_NAME,
        version: '1.0.0',
        state: ReleaseState.Failed,
      },
    ]);
  });

  it('sorts by newest update time and respects the limit', async () => {
    await save({
      packageName: SAMPLE_PACKAGE_NAME,
      version: '1.0.0',
      state: ReleaseState.Succeeded,
    });
    await save({
      packageName: 'sample-package-two',
      version: '2.0.0',
      state: ReleaseState.Succeeded,
    });

    const releases = await fetchRecentReleases('succeeded', 1);
    expect(releases).toHaveLength(1);
    expect(releases[0].packageName).toEqual('sample-package-two');
  });

  it('skips stale indexed release keys', async () => {
    const member = JSON.stringify(['sample-package-two', '2.0.0']);
    await redis.client!.zadd(
      getRedisKeyForRecentReleases('failed'),
      Date.now(),
      member,
    );

    expect(await fetchRecentReleases('failed', 20)).toEqual([]);
  });

  it('backfills recent release indexes from existing release hashes', async () => {
    await redis.client!.hset(
      getRedisKeyForRelease(SAMPLE_PACKAGE_NAME),
      '1.0.0',
      JSON.stringify({
        packageName: SAMPLE_PACKAGE_NAME,
        version: '1.0.0',
        commit: '',
        tag: '',
        state: ReleaseState.Succeeded,
        buildId: '',
        reason: 0,
        createdAt: 100,
        updatedAt: 200,
        source: 'git',
        signed: false,
      }),
      '1.0.1',
      JSON.stringify({
        packageName: SAMPLE_PACKAGE_NAME,
        version: '1.0.1',
        commit: '',
        tag: '',
        state: ReleaseState.Failed,
        buildId: '',
        reason: 700,
        createdAt: 100,
        updatedAt: 300,
        source: 'git',
        signed: false,
      }),
      '1.0.2',
      JSON.stringify({
        packageName: SAMPLE_PACKAGE_NAME,
        version: '1.0.2',
        commit: '',
        tag: '',
        state: ReleaseState.Pending,
        buildId: '',
        reason: 0,
        createdAt: 100,
        updatedAt: 400,
        source: 'git',
        signed: false,
      }),
    );
    await redis.client!.zadd(
      getRedisKeyForRecentReleases('succeeded'),
      1,
      JSON.stringify(['stale-package', '0.0.1']),
    );

    const result = await backfillRecentReleaseIndexes();

    expect(result).toEqual({
      scannedPackages: 1,
      scannedReleases: 3,
      succeeded: 1,
      failed: 1,
    });
    expect(await fetchRecentReleases('succeeded', 20)).toMatchObject([
      { packageName: SAMPLE_PACKAGE_NAME, version: '1.0.0' },
    ]);
    expect(await fetchRecentReleases('failed', 20)).toMatchObject([
      { packageName: SAMPLE_PACKAGE_NAME, version: '1.0.1' },
    ]);
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
