type GenericConfig = {
  github?: {
    tokens?: unknown;
  };
};

const roundRobinState: Record<string, number> = {};

function normalizeTokens(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export function getGitHubTokens(config: GenericConfig): string[] {
  return normalizeTokens(config.github?.tokens);
}

export function getNextGitHubToken(
  config: GenericConfig,
): string | null {
  const tokens = getGitHubTokens(config);
  if (!tokens.length) return null;

  const scope = 'default';
  const current = roundRobinState[scope] ?? 0;
  const index = current % tokens.length;
  roundRobinState[scope] = (current + 1) % tokens.length;
  return tokens[index];
}

export function withGitHubAuthorizationHeader(
  config: GenericConfig,
  headers: Record<string, string>,
): Record<string, string> {
  const token = getNextGitHubToken(config);
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

export function resetGitHubTokenRoundRobin(): void {
  for (const key of Object.keys(roundRobinState)) delete roundRobinState[key];
}
