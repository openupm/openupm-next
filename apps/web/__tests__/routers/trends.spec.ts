import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  getPublicTrends: vi.fn(),
  queueStatusGet: vi.fn(),
  queueStatusClear: vi.fn(),
}));

vi.mock('@openupm/server-common/build/models/trends.js', () => ({
  getPublicTrends: mocks.getPublicTrends,
}));

vi.mock('../../src/status/queueStatus.js', () => ({
  buildPublicQueueStatus: vi.fn(),
  getQueue: vi.fn(),
  createQueueStatusCache: vi.fn(() => ({
    get: mocks.queueStatusGet,
    clear: mocks.queueStatusClear,
  })),
}));

const { app } = await import('../../src/apiServer.js');

describe('trends router', () => {
  beforeEach(async () => {
    await app.ready();
  });

  afterEach(() => {
    mocks.getPublicTrends.mockReset();
    mocks.queueStatusGet.mockReset();
    mocks.queueStatusClear.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the public trends snapshot', async () => {
    mocks.getPublicTrends.mockResolvedValue({
      generatedAt: '2026-06-11T00:00:00.000Z',
      coverage: {},
      catalogGrowth: {
        totalPackageSubmissionsByDay: [],
        totalActivePackagesByDay: [],
        newPackageSubmissionsByMonth: [],
        packageSubmissionsByTopicByDay: [],
        packageSubmissionsByTopicByMonth: [],
      },
      trustAndDistribution: {
        signedPackagesByDay: [],
        releaseSourceAndSigningByDay: [],
      },
      releaseActivity: {
        activePackagesLast12Months: 0,
        totalReleasesByTime: [],
        releasesPerMonth: [],
      },
      downloads: {
        totalDownloadsByTime: [],
        downloadsPerMonth: [],
        downloadsPerMonthByTopic: [],
      },
    });

    const response = await request(app.server)
      .get('/trends')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toMatchObject({
      generatedAt: '2026-06-11T00:00:00.000Z',
      catalogGrowth: { totalPackageSubmissionsByDay: [] },
      downloads: { totalDownloadsByTime: [] },
    });
  });

  it('returns a sanitized 503 response when trends are missing', async () => {
    mocks.getPublicTrends.mockResolvedValue(null);

    const response = await request(app.server)
      .get('/trends')
      .set('Accept', 'application/json')
      .expect(503)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      error: 'TrendsUnavailable',
      message: 'Trends are not ready yet.',
    });
  });
});
