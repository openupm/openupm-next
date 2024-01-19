/* eslint-disable jest/expect-expect */
import request from 'supertest';

import redis from '@openupm/server-common/build/redis.js';

import { app } from '../../src/apiServer.js';

describe('packages', () => {
  beforeEach(async () => {
    await app.ready();
  });

  afterEach(async () => {});

  afterAll(async () => {
    await redis.close();
  });

  it('/ads/custom should return 200', async () => {
    const response = await request(app.server)
      .get('/ads/custom')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
    expect(response.body).not.toBeNull();
    expect(response.body).toEqual({ active: false });
  });
});
