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
  get: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('../../src/status/queueStatus.js', () => ({
  buildPublicQueueStatus: vi.fn(),
  getQueue: vi.fn(),
  createQueueStatusCache: vi.fn(() => ({
    get: mocks.get,
    clear: mocks.clear,
  })),
}));

const { app } = await import('../../src/apiServer.js');

describe('queue status router', () => {
  beforeEach(async () => {
    await app.ready();
  });

  afterEach(() => {
    mocks.get.mockReset();
    mocks.clear.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the public queue status shape', async () => {
    mocks.get.mockResolvedValue({
      generatedAt: '2026-05-14T10:42:00.000Z',
      cache: { state: 'fresh', ttlSeconds: 15 },
      summary: { state: 'healthy', message: 'ok' },
      packageQueue: { active: 0, failed: 0, workers: 0, failedJobs: [] },
      releaseQueue: {
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: 0,
        workers: 0,
        oldestWaitingMs: null,
        activeJobs: [],
        waitingJobs: [],
      },
      recentSuccessfulReleases: [],
      recentFailedReleases: [],
      retainedFailedReleaseJobs: [],
    });

    const response = await request(app.server)
      .get('/queue/status')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toMatchObject({
      generatedAt: '2026-05-14T10:42:00.000Z',
      cache: { state: 'fresh', ttlSeconds: 15 },
      packageQueue: { failedJobs: [] },
      releaseQueue: { activeJobs: [], waitingJobs: [] },
      recentSuccessfulReleases: [],
      recentFailedReleases: [],
      retainedFailedReleaseJobs: [],
    });
  });

  it('returns a sanitized 503 response when status generation fails', async () => {
    mocks.get.mockRejectedValue(
      new Error('redis connection failed /srv/private'),
    );

    const response = await request(app.server)
      .get('/queue/status')
      .set('Accept', 'application/json')
      .expect(503)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      error: 'QueueStatusUnavailable',
      message: 'Queue status is temporarily unavailable.',
    });
  });
});
