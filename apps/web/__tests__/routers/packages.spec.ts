/* eslint-disable jest/expect-expect */
import request from 'supertest';

import { ReleaseModel } from '@openupm/types';
import redis from '@openupm/server-common/build/redis.js';
import {
  save,
  getRedisKeyForRelease,
} from '@openupm/server-common/build/models/release.js';
import { setAggregatedExtraData } from '@openupm/server-common/build/models/packageExtra.js';
import { app } from '../../src/apiServer.js';

const SAMPLE_PACKAGE_NAME = 'sample-package';

const releases: ReleaseModel[] = [
  {
    packageName: SAMPLE_PACKAGE_NAME,
    version: '0.1.0',
    commit: '0000001',
    tag: 'v0.1.0',
    state: 2,
    buildId: '10',
    reason: 0,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    packageName: SAMPLE_PACKAGE_NAME,
    version: '0.2.0',
    commit: '0000002',
    tag: 'v0.2.0',
    state: 2,
    buildId: '16',
    reason: 0,
    createdAt: 0,
    updatedAt: 0,
  },
];

describe('packages', () => {
  beforeEach(async () => {
    await app.ready();
    for (const item of releases) {
      await save(item);
    }
    await setAggregatedExtraData({});
  });

  afterEach(async () => {
    await redis.client!.del(getRedisKeyForRelease(SAMPLE_PACKAGE_NAME));
  });

  afterAll(async () => {
    await redis.close();
  });

  it('/packages/:name should return 200', async () => {
    const response = await request(app.server)
      .get('/packages/' + SAMPLE_PACKAGE_NAME)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    expect(response.body).not.toBeNull();
    expect(response.body.releases).not.toBeUndefined();
    expect(response.body.releases.map((x) => x.tag)).toEqual(
      releases
        .slice()
        .reverse()
        .map((x) => x.tag),
    );
  });

  it('/packages/:name should return 200 for package-not-exist', async () => {
    const response = await request(app.server)
      .get('/packages/package-not-exist')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    expect(response.body).not.toBeNull();
    expect(response.body.releases).toEqual([]);
  });

  it('/packages/extra should return 200', async () => {
    const response = await request(app.server)
      .get('/packages/extra')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    expect(response.body).toEqual({});
  });
});
