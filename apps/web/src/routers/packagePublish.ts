import configRaw from 'config';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getVersionFromTag } from '@openupm/common/build/semver.js';
import { loadPackageMetadataLocal } from '@openupm/local-data';
import { ReleaseErrorCode, ReleaseModel, ReleaseState } from '@openupm/types';
import { fetchOne } from '@openupm/server-common/build/models/release.js';
import { createLogger } from '@openupm/server-common/build/log.js';

import {
  PublishTriggerAuthError,
  verifyGitHubActionsOidcToken,
} from '../publishTrigger/githubOidc.js';
import { enqueuePackageRefresh } from '../publishTrigger/packageRefresh.js';
import {
  assertPublishTriggerRateLimit,
  PublishTriggerRateLimitError,
} from '../publishTrigger/rateLimit.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/web/packagePublish');

interface RefreshBody {
  version?: string;
  tag?: string;
}

type ReleasePublishState =
  | 'unknown'
  | 'pending'
  | 'building'
  | 'succeeded'
  | 'failed';

interface ReleaseStatusResponse {
  packageName: string;
  version: string;
  state: ReleasePublishState;
  reason: string;
  signed: boolean;
  publishedVersion?: string;
  registryUrl: string;
  packageUrl: string;
}

function apiBaseUrl(): string {
  return (config.publishTrigger?.apiBaseUrl || 'https://api.openupm.com')
    .replace(/\/+$/g, '');
}

function packageUrl(packageName: string): string {
  const base = (config.publishTrigger?.packageBaseUrl || 'https://openupm.com')
    .replace(/\/+$/g, '');
  return `${base}/packages/${encodeURIComponent(packageName)}/`;
}

function releaseStateName(release: ReleaseModel | null): ReleasePublishState {
  if (!release) return 'unknown';
  if (release.state === ReleaseState.Pending) return 'pending';
  if (release.state === ReleaseState.Building) return 'building';
  if (release.state === ReleaseState.Succeeded) return 'succeeded';
  return 'failed';
}

function releaseReasonName(release: ReleaseModel | null): string {
  if (!release) return 'unknown';
  if (release.reason === ReleaseErrorCode.None) return 'none';
  return ReleaseErrorCode[release.reason] || String(release.reason);
}

async function releaseStatus(
  packageName: string,
  version: string,
): Promise<ReleaseStatusResponse> {
  const release = await fetchOne(packageName, version);
  return {
    packageName,
    version,
    state: releaseStateName(release),
    reason: releaseReasonName(release),
    signed: release?.signed ?? false,
    publishedVersion: release?.publishedVersion,
    registryUrl:
      config.publishTrigger?.registryUrl || 'https://package.openupm.com',
    packageUrl: packageUrl(packageName),
  };
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
): FastifyReply {
  return reply.status(statusCode).send({ error: code, message });
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveRefreshVersion(
  version: string | undefined,
  tag: string | undefined,
): string | null {
  if (version) return version;
  return tag ? getVersionFromTag(tag) : null;
}

export default function router(server: FastifyInstance): void {
  server.post(
    '/packages/:name/refresh',
    async (
      request: FastifyRequest<{ Params: { name: string }; Body: RefreshBody }>,
      reply: FastifyReply,
    ) => {
      const packageName = request.params.name;
      const tag = normalizeOptionalString(request.body?.tag);
      const version = resolveRefreshVersion(
        normalizeOptionalString(request.body?.version),
        tag,
      );

      if (!version) {
        return sendError(
          reply,
          400,
          'MissingVersion',
          'A package version is required when it cannot be derived from the tag.',
        );
      }

      const token = bearerToken(request);
      if (!token) {
        return sendError(
          reply,
          401,
          'MissingToken',
          'A GitHub Actions OIDC bearer token is required.',
        );
      }

      const pkg = await loadPackageMetadataLocal(packageName);
      if (!pkg) {
        return sendError(
          reply,
          404,
          'PackageNotFound',
          'The package is not registered in OpenUPM.',
        );
      }

      try {
        const claims = await verifyGitHubActionsOidcToken(token, {
          packageRepoUrl: pkg.repoUrl,
          tag,
        });
        assertPublishTriggerRateLimit({
          packageName,
          repository: claims.repository || '',
          ip: request.ip,
        });

        const job = await enqueuePackageRefresh(packageName);
        const status = await releaseStatus(packageName, version);
        logger.info(
          {
            packageName,
            version,
            tag,
            repository: claims.repository,
            event: claims.event_name,
            ref: claims.ref,
            jobId: job.jobId,
            added: job.added,
          },
          'accepted package refresh trigger',
        );

        return reply.status(202).send({
          packageName,
          version,
          tag,
          accepted: true,
          deduped: !job.added,
          statusUrl: `${apiBaseUrl()}/packages/${encodeURIComponent(
            packageName,
          )}/releases/${encodeURIComponent(version)}/status`,
          release: {
            state: status.state,
            reason: status.reason,
          },
        });
      } catch (error) {
        if (error instanceof PublishTriggerAuthError) {
          logger.warn(
            { packageName, version, tag, code: error.code },
            'rejected package refresh trigger',
          );
          return sendError(
            reply,
            error.statusCode,
            error.code,
            error.message,
          );
        }

        if (error instanceof PublishTriggerRateLimitError) {
          reply.header('Retry-After', String(error.retryAfterSeconds));
          return sendError(
            reply,
            429,
            'RateLimitExceeded',
            error.message,
          );
        }

        throw error;
      }
    },
  );

  server.get(
    '/packages/:name/releases/:version/status',
    async (
      request: FastifyRequest<{
        Params: { name: string; version: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { name, version } = request.params;
      const pkg = await loadPackageMetadataLocal(name);
      if (!pkg) {
        return sendError(
          reply,
          404,
          'PackageNotFound',
          'The package is not registered in OpenUPM.',
        );
      }

      return reply.send(await releaseStatus(name, version));
    },
  );
}
