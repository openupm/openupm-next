/* eslint-disable jest/expect-expect */
import request from 'supertest';

import { setStars } from '@openupm/server-common/build/models/siteInfo.js';
import redis from '@openupm/server-common/build/redis.js';

import { app } from '../../src/apiServer.js';

const STARS = 100;

describe('packages', () => {
  beforeEach(async () => {
    await app.ready();
    await setStars(STARS);
  });

  afterEach(async () => {
    await setStars(0);
  });

  afterAll(async () => {
    await redis.close();
  });

  it('/site/info should return 200', async () => {
    const response = await request(app.server)
      .get('/site/info')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    expect(response.body).not.toBeNull();
    expect(response.body.stars).toEqual(STARS);
  });
});
