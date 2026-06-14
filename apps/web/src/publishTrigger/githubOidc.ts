import configRaw from 'config';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyResult,
} from 'jose';
import {
  JOSEError,
  JWKSInvalid,
  JWKSTimeout,
} from 'jose/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

export interface GitHubActionsOidcClaims extends JWTPayload {
  event_name?: string;
  ref?: string;
  ref_type?: string;
  repository?: string;
  repository_visibility?: string;
}

export interface GitHubActionsOidcValidationOptions {
  packageRepoUrl: string;
  tag?: string;
}

export class PublishTriggerAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 401,
  ) {
    super(message);
  }
}

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function oidcConfig(): {
  audience: string;
  issuer: string;
  jwksUri: string;
  acceptedEvents: string[];
  requirePublicRepository: boolean;
  clockToleranceSeconds: number;
} {
  const raw = config.publishTrigger?.githubOidc || {};
  const issuer = raw.issuer || 'https://token.actions.githubusercontent.com';
  return {
    audience: raw.audience || 'openupm',
    issuer,
    jwksUri: raw.jwksUri || `${issuer}/.well-known/jwks`,
    acceptedEvents: raw.acceptedEvents || [
      'push',
      'release',
      'workflow_dispatch',
    ],
    requirePublicRepository: raw.requirePublicRepository !== false,
    clockToleranceSeconds: raw.clockToleranceSeconds ?? 30,
  };
}

function getRemoteJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (remoteJwks) return remoteJwks;
  remoteJwks = createRemoteJWKSet(new URL(oidcConfig().jwksUri));
  return remoteJwks;
}

export function resetGitHubActionsOidcJwksForTests(): void {
  remoteJwks = null;
}

export function isRetryableJwksError(error: unknown): boolean {
  if (error instanceof JWKSTimeout || error instanceof JWKSInvalid) {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  return (
    error instanceof JOSEError &&
    error.code === 'ERR_JOSE_GENERIC' &&
    (error.message.includes('JSON Web Key Set HTTP response') ||
      error.message.includes('JSON Web Key Set malformed'))
  );
}

export function normalizeGitHubRepository(value: string): string | null {
  const sshPrefix = 'git@github.com:';
  if (value.startsWith(sshPrefix)) {
    const path = value.slice(sshPrefix.length);
    const [owner, rawRepo] = path.split('/').filter(Boolean);
    if (!owner || !rawRepo) return null;
    return `${owner}/${rawRepo.replace(/\.git$/i, '')}`.toLowerCase();
  }

  try {
    const parsed = new URL(value);
    if (parsed.hostname.toLowerCase() !== 'github.com') return null;
    const [owner, rawRepo] = parsed.pathname.split('/').filter(Boolean);
    if (!owner || !rawRepo) return null;
    return `${owner}/${rawRepo.replace(/\.git$/i, '')}`.toLowerCase();
  } catch {
    return null;
  }
}

function asClaims(payload: JWTPayload): GitHubActionsOidcClaims {
  return payload as GitHubActionsOidcClaims;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function immutableRepoSubjectPattern(repository: string, ref: string): RegExp {
  const [owner, repo] = repository.split('/');
  return new RegExp(
    `^repo:${escapeRegExp(owner)}@[0-9]+/${escapeRegExp(
      repo,
    )}@[0-9]+:ref:${escapeRegExp(ref)}(?::|$)`,
    'i',
  );
}

function validateSubjectRef(
  claims: GitHubActionsOidcClaims,
  packageRepo: string,
): void {
  if (!claims.sub || !claims.ref || !claims.sub.includes(':ref:')) return;

  const expectedLegacySubject = `repo:${packageRepo}:ref:${claims.ref}`;
  const lowerSubject = claims.sub.toLowerCase();
  const lowerExpectedSubject = expectedLegacySubject.toLowerCase();
  if (
    lowerSubject === lowerExpectedSubject ||
    lowerSubject.startsWith(`${lowerExpectedSubject}:`)
  ) {
    return;
  }

  if (immutableRepoSubjectPattern(packageRepo, claims.ref).test(claims.sub)) {
    return;
  }

  throw new PublishTriggerAuthError(
    'SubjectMismatch',
    'The GitHub Actions OIDC token subject does not match this package.',
    403,
  );
}

export function validateGitHubActionsOidcClaims(
  claims: GitHubActionsOidcClaims,
  options: GitHubActionsOidcValidationOptions,
): GitHubActionsOidcClaims {
  const {
    acceptedEvents,
    issuer,
    requirePublicRepository,
    audience,
  } = oidcConfig();

  if (claims.iss !== issuer) {
    throw new PublishTriggerAuthError(
      'InvalidIssuer',
      'The GitHub Actions OIDC token has an invalid issuer.',
    );
  }

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(audience)) {
    throw new PublishTriggerAuthError(
      'InvalidAudience',
      'The GitHub Actions OIDC token has an invalid audience.',
    );
  }

  if (!claims.repository) {
    throw new PublishTriggerAuthError(
      'MissingRepositoryClaim',
      'The GitHub Actions OIDC token is missing its repository claim.',
    );
  }

  const packageRepo = normalizeGitHubRepository(options.packageRepoUrl);
  if (!packageRepo) {
    throw new PublishTriggerAuthError(
      'UnsupportedRepositoryUrl',
      'The package repository URL is not a supported GitHub repository URL.',
      403,
    );
  }

  if (claims.repository.toLowerCase() !== packageRepo) {
    throw new PublishTriggerAuthError(
      'RepositoryMismatch',
      'The GitHub Actions OIDC token repository does not match this package.',
      403,
    );
  }

  validateSubjectRef(claims, packageRepo);

  if (requirePublicRepository && claims.repository_visibility !== 'public') {
    throw new PublishTriggerAuthError(
      'UnsupportedRepositoryVisibility',
      'Only public GitHub repositories can trigger OpenUPM publishing.',
      403,
    );
  }

  if (!claims.event_name || !acceptedEvents.includes(claims.event_name)) {
    throw new PublishTriggerAuthError(
      'UnsupportedEvent',
      'This GitHub Actions event cannot trigger OpenUPM publishing.',
      403,
    );
  }

  if (claims.event_name === 'pull_request') {
    throw new PublishTriggerAuthError(
      'UnsupportedEvent',
      'Pull request workflows cannot trigger OpenUPM publishing.',
      403,
    );
  }

  if (options.tag) {
    const expectedRef = `refs/tags/${options.tag}`;
    if (claims.ref_type !== 'tag' || claims.ref !== expectedRef) {
      throw new PublishTriggerAuthError(
        'RefMismatch',
        'The GitHub Actions OIDC token ref does not match the requested tag.',
        403,
      );
    }
  }

  return claims;
}

export async function verifyGitHubActionsOidcToken(
  token: string,
  options: GitHubActionsOidcValidationOptions,
): Promise<GitHubActionsOidcClaims> {
  const raw = oidcConfig();
  let result: JWTVerifyResult;
  try {
    result = await jwtVerify(token, getRemoteJwks(), {
      audience: raw.audience,
      issuer: raw.issuer,
      clockTolerance: raw.clockToleranceSeconds,
    });
  } catch (error) {
    if (isRetryableJwksError(error)) {
      throw new PublishTriggerAuthError(
        'OidcUnavailable',
        'GitHub Actions OIDC verification is temporarily unavailable.',
        503,
      );
    }
    throw new PublishTriggerAuthError(
      'InvalidToken',
      'The GitHub Actions OIDC token could not be verified.',
    );
  }

  return validateGitHubActionsOidcClaims(asClaims(result.payload), options);
}
