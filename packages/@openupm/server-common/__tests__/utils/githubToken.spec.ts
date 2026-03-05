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
    expect(getNextGitHubToken(config)).toBe('a');
    expect(getNextGitHubToken(config)).toBe('b');
    expect(getNextGitHubToken(config)).toBe('a');
  });

  it('uses bounded counter (no unbounded growth)', () => {
    const config = { github: { tokens: ['a', 'b'] } };
    for (let i = 0; i < 1000; i++) getNextGitHubToken(config);
    expect(getNextGitHubToken(config)).toBe('a');
  });

  it('adds authorization header when token exists', () => {
    const headers = withGitHubAuthorizationHeader(
      { github: { tokens: ['tok-a'] } },
      { Accept: 'application/json' },
    );
    expect(headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer tok-a',
    });
  });
});
