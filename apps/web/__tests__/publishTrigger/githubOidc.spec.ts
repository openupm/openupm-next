import { describe, expect, it } from 'vitest';

import {
  normalizeGitHubRepository,
  PublishTriggerAuthError,
  validateGitHubActionsOidcClaims,
  type GitHubActionsOidcClaims,
} from '../../src/publishTrigger/githubOidc.js';

function claims(
  overrides: Partial<GitHubActionsOidcClaims> = {},
): GitHubActionsOidcClaims {
  return {
    iss: 'https://token.actions.githubusercontent.com',
    aud: 'openupm',
    repository: 'openupm/com.example.openupm-action',
    repository_visibility: 'public',
    event_name: 'push',
    ref_type: 'tag',
    ref: 'refs/tags/upm/1.2.3',
    sub:
      'repo:openupm/com.example.openupm-action:ref:refs/tags/upm/1.2.3',
    ...overrides,
  };
}

function expectAuthError(fn: () => unknown, code: string): void {
  try {
    fn();
    throw new Error('expected auth error');
  } catch (error) {
    expect(error).toBeInstanceOf(PublishTriggerAuthError);
    expect((error as PublishTriggerAuthError).code).toBe(code);
  }
}

describe('githubOidc', () => {
  it('normalizes GitHub repository URLs', () => {
    expect(
      normalizeGitHubRepository(
        'https://github.com/OpenUPM/com.example.openupm-action.git',
      ),
    ).toBe('openupm/com.example.openupm-action');
    expect(
      normalizeGitHubRepository(
        'git@github.com:OpenUPM/com.example.openupm-action.git',
      ),
    ).toBe('openupm/com.example.openupm-action');
    expect(normalizeGitHubRepository('https://gitlab.com/openupm/demo')).toBe(
      null,
    );
  });

  it('accepts valid claims for the registered package repository and tag', () => {
    const validated = validateGitHubActionsOidcClaims(claims(), {
      packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
      tag: 'upm/1.2.3',
    });

    expect(validated.repository).toBe('openupm/com.example.openupm-action');
  });

  it('accepts release event claims for a matching registered tag', () => {
    const validated = validateGitHubActionsOidcClaims(
      claims({
        event_name: 'release',
        ref: 'refs/tags/v1.2.3',
        sub:
          'repo:openupm/com.example.openupm-action:ref:refs/tags/v1.2.3',
      }),
      {
        packageRepoUrl:
          'https://github.com/openupm/com.example.openupm-action',
        tag: 'v1.2.3',
      },
    );

    expect(validated.event_name).toBe('release');
  });

  it('accepts immutable repository subject formats for a matching tag', () => {
    const validated = validateGitHubActionsOidcClaims(
      claims({
        sub:
          'repo:openupm@100/com.example.openupm-action@200:ref:refs/tags/upm/1.2.3',
      }),
      {
        packageRepoUrl:
          'https://github.com/openupm/com.example.openupm-action',
        tag: 'upm/1.2.3',
      },
    );

    expect(validated.sub).toContain('@200');
  });

  it('rejects subject ref mismatches', () => {
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(
          claims({
            sub:
              'repo:openupm/com.example.openupm-action:ref:refs/tags/other',
          }),
          {
            packageRepoUrl:
              'https://github.com/openupm/com.example.openupm-action',
            tag: 'upm/1.2.3',
          },
        ),
      'SubjectMismatch',
    );
  });

  it('rejects wrong audience', () => {
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(claims({ aud: 'wrong' }), {
          packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
          tag: 'upm/1.2.3',
        }),
      'InvalidAudience',
    );
  });

  it('rejects wrong issuer', () => {
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(claims({ iss: 'https://example.com' }), {
          packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
          tag: 'upm/1.2.3',
        }),
      'InvalidIssuer',
    );
  });

  it('rejects repository mismatch', () => {
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(claims({ repository: 'evil/demo' }), {
          packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
          tag: 'upm/1.2.3',
        }),
      'RepositoryMismatch',
    );
  });

  it('rejects private repositories for the initial rollout', () => {
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(
          claims({ repository_visibility: 'private' }),
          {
            packageRepoUrl:
              'https://github.com/openupm/com.example.openupm-action',
            tag: 'upm/1.2.3',
          },
        ),
      'UnsupportedRepositoryVisibility',
    );
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(
          claims({ repository_visibility: undefined }),
          {
            packageRepoUrl:
              'https://github.com/openupm/com.example.openupm-action',
            tag: 'upm/1.2.3',
          },
        ),
      'UnsupportedRepositoryVisibility',
    );
  });

  it('rejects unsupported events and ref mismatches', () => {
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(claims({ event_name: 'pull_request' }), {
          packageRepoUrl: 'https://github.com/openupm/com.example.openupm-action',
          tag: 'upm/1.2.3',
        }),
      'UnsupportedEvent',
    );
    expectAuthError(
      () =>
        validateGitHubActionsOidcClaims(
          claims({
            ref: 'refs/tags/v1.2.3',
            sub:
              'repo:openupm/com.example.openupm-action:ref:refs/tags/v1.2.3',
          }),
          {
            packageRepoUrl:
              'https://github.com/openupm/com.example.openupm-action',
            tag: 'upm/1.2.3',
          },
        ),
      'RefMismatch',
    );
  });
});
