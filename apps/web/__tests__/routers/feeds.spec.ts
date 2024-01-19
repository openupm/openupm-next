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

  it('/feeds/updates/rss should return 200', async () => {
    await request(app.server)
      .get('/feeds/updates/rss')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', 'application/rss+xml');
  });

  it('/feeds/updates/atom should return 200', async () => {
    await request(app.server)
      .get('/feeds/updates/atom')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', 'application/atom+xml');
  });

  it('/feeds/updates/json should return 200', async () => {
    await request(app.server)
      .get('/feeds/updates/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
  });
});
