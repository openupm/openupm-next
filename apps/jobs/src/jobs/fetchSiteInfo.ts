import { createLogger } from '@openupm/server-common/build/log.js';
import { setStars } from '@openupm/server-common/build/models/siteInfo.js';

const logger = createLogger('@openupm/jobs/fetchSiteInfo');

export async function fetchGitHubStars(repo: string): Promise<number> {
  const url = `https://api.github.com/repos/${repo}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, {
    headers,
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`GitHub API failed for ${repo} with status ${response.status}`);
  }
  const json = (await response.json()) as { stargazers_count?: number };
  return json.stargazers_count || 0;
}

export async function fetchSiteInfoJob(repo = 'openupm/openupm'): Promise<void> {
  try {
    const stars = await fetchGitHubStars(repo);
    await setStars(stars);
  } catch (err) {
    logger.error({ err, repo }, 'failed to fetch site info');
  }
}
