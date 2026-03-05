import {
  getGitHubTokens,
  getNextGitHubToken,
  resetGitHubTokenRoundRobin,
  withGitHubAuthorizationHeader,
} from '../../src/utils/githubToken.js';

describe('githubToken utils', () => {
  afterEach(() => {
    resetGitHubTokenRoundRobin();
  });

  it('normalizes token list from config', () => {
    const tokens = getGitHubTokens({
      github: {
        tokens: [' tok-a ', '', 1, 'tok-b', '   '],
      },
    });
    expect(tokens).toEqual(['tok-a', 'tok-b']);
  });

  it('returns round-robin token per scope', () => {
    const config = { github: { tokens: ['a', 'b'] } };
    expect(getNextGitHubToken(config, 'jobs')).toBe('a');
    expect(getNextGitHubToken(config, 'jobs')).toBe('b');
    expect(getNextGitHubToken(config, 'jobs')).toBe('a');
  });

  it('keeps independent state between scopes', () => {
    const config = { github: { tokens: ['a', 'b'] } };
    expect(getNextGitHubToken(config, 'jobs')).toBe('a');
    expect(getNextGitHubToken(config, 'queue')).toBe('a');
    expect(getNextGitHubToken(config, 'jobs')).toBe('b');
    expect(getNextGitHubToken(config, 'queue')).toBe('b');
  });

  it('adds authorization header when token exists', () => {
    const headers = withGitHubAuthorizationHeader(
      { github: { tokens: ['tok-a'] } },
      { Accept: 'application/json' },
      'jobs',
    );
    expect(headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer tok-a',
    });
  });
});
