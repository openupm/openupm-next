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

import { ReleaseErrorCode, ReleaseModel, ReleaseState } from '@openupm/types';

class MockPublishTriggerAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 401,
  ) {
    super(message);
  }
}

class MockPublishTriggerRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('The package refresh trigger rate limit was exceeded.');
  }
}

const mocks = vi.hoisted(() => ({
  loadPackageMetadataLocal: vi.fn(),
  verifyGitHubActionsOidcToken: vi.fn(),
  enqueuePackageRefresh: vi.fn(),
  assertPublishTriggerRateLimit: vi.fn(),
  fetchOne: vi.fn(),
  removeRelease: vi.fn(),
}));

vi.mock('@openupm/local-data', () => ({
  loadPackageMetadataLocal: mocks.loadPackageMetadataLocal,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  fetchOne: mocks.fetchOne,
  remove: mocks.removeRelease,
}));

vi.mock('../../src/publishTrigger/githubOidc.js', () => ({
  PublishTriggerAuthError: MockPublishTriggerAuthError,
  verifyGitHubActionsOidcToken: mocks.verifyGitHubActionsOidcToken,
}));

vi.mock('../../src/publishTrigger/packageRefresh.js', () => ({
  enqueuePackageRefresh: mocks.enqueuePackageRefresh,
}));

vi.mock('../../src/publishTrigger/rateLimit.js', () => ({
  PublishTriggerRateLimitError: MockPublishTriggerRateLimitError,
  assertPublishTriggerRateLimit: mocks.assertPublishTriggerRateLimit,
}));

const { app } = await import('../../src/apiServer.js');

const PACKAGE_NAME = 'com.example.openupm-action';
const VERSION = '1.2.3';

function metadata() {
  return {
    name: PACKAGE_NAME,
    repoUrl: 'https://github.com/openupm/com.example.openupm-action',
  };
}

function release(
  state: ReleaseState,
  overrides: Partial<ReleaseModel> = {},
): ReleaseModel {
  return {
    packageName: PACKAGE_NAME,
    version: VERSION,
    commit: 'abc123',
    tag: 'upm/1.2.3',
    buildId: '123',
    state,
    reason: ReleaseErrorCode.None,
    createdAt: 0,
    updatedAt: 0,
    source: 'git',
    signed: false,
    ...overrides,
  };
}

describe('package publish router', () => {
  beforeEach(async () => {
    await app.ready();
    mocks.loadPackageMetadataLocal.mockResolvedValue(metadata());
    mocks.verifyGitHubActionsOidcToken.mockResolvedValue({
      repository: 'openupm/com.example.openupm-action',
      event_name: 'push',
      ref: 'refs/tags/upm/1.2.3',
    });
    mocks.enqueuePackageRefresh.mockResolvedValue({
      queue: 'pkg',
      jobId: `build-pkg|${PACKAGE_NAME}`,
      added: true,
    });
    mocks.fetchOne.mockResolvedValue(null);
    mocks.removeRelease.mockResolvedValue(undefined);
  });

  afterEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a verified package refresh trigger', async () => {
    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'upm/1.2.3' })
      .expect(202)
      .expect('Content-Type', /json/);

    expect(mocks.verifyGitHubActionsOidcToken).toHaveBeenCalledWith(
      'test-token',
      {
        packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
        tag: 'upm/1.2.3',
      },
    );
    expect(mocks.assertPublishTriggerRateLimit).toHaveBeenCalledWith({
      packageName: PACKAGE_NAME,
      repository: 'openupm/com.example.openupm-action',
      ip: expect.any(String),
    });
    expect(mocks.enqueuePackageRefresh).toHaveBeenCalledWith(PACKAGE_NAME);
    expect(response.body).toMatchObject({
      packageName: PACKAGE_NAME,
      version: VERSION,
      tag: 'upm/1.2.3',
      accepted: true,
      deduped: false,
      release: {
        state: 'unknown',
        reason: 'unknown',
      },
    });
    expect(response.body.job).toBeUndefined();
  });

  it('reports deduped refresh triggers', async () => {
    mocks.enqueuePackageRefresh.mockResolvedValue({
      queue: 'pkg',
      jobId: `build-pkg|${PACKAGE_NAME}`,
      added: false,
    });

    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'upm/1.2.3' })
      .expect(202);

    expect(response.body.deduped).toBe(true);
  });

  it('normalizes refresh request tag field', async () => {
    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: ' upm/1.2.3 ' })
      .expect(202);

    expect(mocks.verifyGitHubActionsOidcToken).toHaveBeenCalledWith(
      'test-token',
      {
        packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
        tag: 'upm/1.2.3',
      },
    );
    expect(mocks.fetchOne).toHaveBeenCalledWith(PACKAGE_NAME, VERSION);
    expect(response.body).toMatchObject({
      version: VERSION,
      tag: 'upm/1.2.3',
    });
  });

  it('derives the package version from the requested tag', async () => {
    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: ' upm/v1.2.3 ' })
      .expect(202);

    expect(mocks.verifyGitHubActionsOidcToken).toHaveBeenCalledWith(
      'test-token',
      {
        packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
        tag: 'upm/v1.2.3',
      },
    );
    expect(mocks.fetchOne).toHaveBeenCalledWith(PACKAGE_NAME, VERSION);
    expect(response.body).toMatchObject({
      version: VERSION,
      tag: 'upm/v1.2.3',
      accepted: true,
    });
  });

  it('clears a stale failed release after accepting a refresh', async () => {
    mocks.fetchOne
      .mockResolvedValueOnce(
        release(ReleaseState.Failed, {
          reason: ReleaseErrorCode.VersionMismatch,
        }),
      )
      .mockResolvedValueOnce(null);

    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'upm/1.2.3' })
      .expect(202);

    expect(mocks.enqueuePackageRefresh).toHaveBeenCalledWith(PACKAGE_NAME);
    expect(mocks.removeRelease).toHaveBeenCalledWith(PACKAGE_NAME, VERSION);
    expect(response.body.release).toMatchObject({
      state: 'unknown',
      reason: 'unknown',
    });
  });

  it('keeps non-failed release status while accepting a refresh', async () => {
    mocks.fetchOne
      .mockResolvedValueOnce(release(ReleaseState.Succeeded))
      .mockResolvedValueOnce(release(ReleaseState.Succeeded));

    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'upm/1.2.3' })
      .expect(202);

    expect(mocks.removeRelease).not.toHaveBeenCalled();
    expect(response.body.release).toMatchObject({
      state: 'succeeded',
      reason: 'none',
    });
  });

  it('accepts GitHub Release event refresh triggers', async () => {
    mocks.verifyGitHubActionsOidcToken.mockResolvedValueOnce({
      repository: 'openupm/com.example.openupm-action',
      event_name: 'release',
      ref: 'refs/tags/v1.2.3',
    });

    const response = await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer release-token')
      .send({ tag: 'v1.2.3' })
      .expect(202);

    expect(mocks.verifyGitHubActionsOidcToken).toHaveBeenCalledWith(
      'release-token',
      {
        packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
        tag: 'v1.2.3',
      },
    );
    expect(response.body).toMatchObject({
      packageName: PACKAGE_NAME,
      version: VERSION,
      tag: 'v1.2.3',
      accepted: true,
    });
  });

  it('rejects missing or unparseable tags before enqueuing', async () => {
    await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({})
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toBe('InvalidTag');
      });

    await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ version: '   ' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toBe('InvalidTag');
      });

    await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'release' })
      .expect(400);

    await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .send({ tag: 'upm/1.2.3' })
      .expect(401);

    expect(mocks.enqueuePackageRefresh).not.toHaveBeenCalled();
  });

  it('maps OIDC and rate-limit rejections to stable API errors', async () => {
    mocks.verifyGitHubActionsOidcToken.mockRejectedValueOnce(
      new MockPublishTriggerAuthError(
        'RepositoryMismatch',
        'The GitHub Actions OIDC token repository does not match this package.',
        403,
      ),
    );

    await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'upm/1.2.3' })
      .expect(403)
      .expect(({ body }) => {
        expect(body.error).toBe('RepositoryMismatch');
      });

    mocks.assertPublishTriggerRateLimit.mockImplementationOnce(() => {
      throw new MockPublishTriggerRateLimitError(60);
    });

    await request(app.server)
      .post(`/packages/${PACKAGE_NAME}/refresh`)
      .set('Authorization', 'Bearer test-token')
      .send({ tag: 'upm/1.2.3' })
      .expect(429)
      .expect('Retry-After', '60');
  });

  it('returns release status for all public states', async () => {
    mocks.fetchOne.mockResolvedValueOnce(null);
    await request(app.server)
      .get(`/packages/${PACKAGE_NAME}/releases/${VERSION}/status`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.state).toBe('unknown');
        expect(body.reason).toBe('unknown');
      });

    mocks.fetchOne.mockResolvedValueOnce(release(ReleaseState.Pending));
    await request(app.server)
      .get(`/packages/${PACKAGE_NAME}/releases/${VERSION}/status`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.state).toBe('pending');
        expect(body.reason).toBe('none');
      });

    mocks.fetchOne.mockResolvedValueOnce(release(ReleaseState.Building));
    await request(app.server)
      .get(`/packages/${PACKAGE_NAME}/releases/${VERSION}/status`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.state).toBe('building');
      });

    mocks.fetchOne.mockResolvedValueOnce(
      release(ReleaseState.Succeeded, {
        signed: true,
        publishedVersion: '1.2.4',
      }),
    );
    await request(app.server)
      .get(`/packages/${PACKAGE_NAME}/releases/${VERSION}/status`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          state: 'succeeded',
          signed: true,
          publishedVersion: '1.2.4',
        });
      });

    mocks.fetchOne.mockResolvedValueOnce(
      release(ReleaseState.Failed, {
        reason: ReleaseErrorCode.GitHubReleaseAssetNotFound,
      }),
    );
    await request(app.server)
      .get(`/packages/${PACKAGE_NAME}/releases/${VERSION}/status`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.state).toBe('failed');
        expect(body.reason).toBe('GitHubReleaseAssetNotFound');
      });
  });

  it('returns 404 status for packages not registered in OpenUPM', async () => {
    mocks.loadPackageMetadataLocal.mockResolvedValue(null);

    await request(app.server)
      .get(`/packages/${PACKAGE_NAME}/releases/${VERSION}/status`)
      .expect(404)
      .expect(({ body }) => {
        expect(body.error).toBe('PackageNotFound');
      });
  });
});
