import { ReleaseErrorCode } from '@openupm/types';
import { withGitHubAuthorizationHeader } from '@openupm/server-common/build/utils/githubToken.js';

export type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubReleaseResponse = {
  tag_name?: string;
  assets?: GitHubReleaseAsset[];
};

export type ResolvedGitHubReleaseAsset = {
  packageAssetName: string;
  packageAssetUrl: string;
};

export class GitHubReleaseAssetError extends Error {
  constructor(
    message: string,
    public readonly reason: ReleaseErrorCode,
  ) {
    super(message);
    this.name = 'GitHubReleaseAssetError';
  }
}

export function parseGitHubRepoUrl(
  repoUrl: string,
): { owner: string; repo: string } | null {
  if (repoUrl.startsWith('git@github.com:')) {
    const match = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i.exec(repoUrl);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  }

  let parsed: URL;
  try {
    parsed = new URL(repoUrl);
  } catch {
    return null;
  }
  if (!/github\.com$/i.test(parsed.host)) return null;
  const [owner, repoWithSuffix] = parsed.pathname.split('/').filter(Boolean);
  if (!owner || !repoWithSuffix) return null;
  return { owner, repo: repoWithSuffix.replace(/\.git$/i, '') };
}

export function isPublishableReleaseAsset(name: string): boolean {
  return name.endsWith('.tgz') || name.endsWith('.tar.gz');
}

export function selectGitHubReleaseAsset(
  assets: GitHubReleaseAsset[],
  githubReleaseAssetName?: string,
): GitHubReleaseAsset {
  const publishableAssets = assets.filter((asset) =>
    isPublishableReleaseAsset(asset.name),
  );
  if (githubReleaseAssetName) {
    const exactMatch = publishableAssets.find(
      (asset) => asset.name === githubReleaseAssetName,
    );
    if (exactMatch) return exactMatch;

    const prefixMatches = publishableAssets.filter((asset) =>
      asset.name.startsWith(githubReleaseAssetName),
    );
    if (prefixMatches.length === 0) {
      throw new GitHubReleaseAssetError(
        `GitHub Release asset not found: ${githubReleaseAssetName}`,
        ReleaseErrorCode.GitHubReleaseAssetNotFound,
      );
    }
    if (prefixMatches.length > 1) {
      throw new GitHubReleaseAssetError(
        'GitHub Release has multiple assets matching githubReleaseAssetName; set a more specific prefix or exact filename',
        ReleaseErrorCode.GitHubReleaseAssetAmbiguous,
      );
    }
    return prefixMatches[0];
  }

  if (publishableAssets.length === 0) {
    throw new GitHubReleaseAssetError(
      'GitHub Release has no publishable .tgz or .tar.gz asset',
      ReleaseErrorCode.GitHubReleaseAssetNotFound,
    );
  }
  if (publishableAssets.length > 1) {
    throw new GitHubReleaseAssetError(
      'GitHub Release has multiple publishable assets; set githubReleaseAssetName',
      ReleaseErrorCode.GitHubReleaseAssetAmbiguous,
    );
  }
  return publishableAssets[0];
}

export async function resolveGitHubReleaseAsset(options: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  repoUrl: string;
  releaseTag: string;
  githubReleaseAssetName?: string;
}): Promise<ResolvedGitHubReleaseAsset> {
  const repo = parseGitHubRepoUrl(options.repoUrl);
  if (!repo) {
    throw new GitHubReleaseAssetError(
      `GitHub Release tracking requires a GitHub repoUrl: ${options.repoUrl}`,
      ReleaseErrorCode.RemoteRepositoryUnavailable,
    );
  }

  const releaseUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/tags/${encodeURIComponent(
    options.releaseTag,
  )}`;
  const headers = withGitHubAuthorizationHeader(options.config, {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });

  let response: Response;
  try {
    response = await fetch(releaseUrl, { headers });
  } catch (error) {
    throw new GitHubReleaseAssetError(
      `GitHub Release API request failed: ${error instanceof Error ? error.message : String(error)}`,
      ReleaseErrorCode.GitHubReleaseApiError,
    );
  }

  if (response.status === 404) {
    throw new GitHubReleaseAssetError(
      `GitHub Release not found for tag ${options.releaseTag}`,
      ReleaseErrorCode.GitHubReleaseNotFound,
    );
  }
  if (response.status === 403 || response.status === 429 || response.status >= 500) {
    throw new GitHubReleaseAssetError(
      `GitHub Release API failed with status ${response.status}`,
      ReleaseErrorCode.GitHubReleaseApiError,
    );
  }
  if (!response.ok) {
    throw new GitHubReleaseAssetError(
      `GitHub Release API failed with status ${response.status}`,
      ReleaseErrorCode.GitHubReleaseAssetNotFound,
    );
  }

  let release: GitHubReleaseResponse;
  try {
    release = (await response.json()) as GitHubReleaseResponse;
  } catch (error) {
    throw new GitHubReleaseAssetError(
      `GitHub Release API response was not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      ReleaseErrorCode.GitHubReleaseApiError,
    );
  }
  if (release.tag_name !== options.releaseTag) {
    throw new GitHubReleaseAssetError(
      `GitHub Release tag mismatch: actual=${release.tag_name || ''}, expected=${options.releaseTag}`,
      ReleaseErrorCode.GitHubReleaseNotFound,
    );
  }

  const asset = selectGitHubReleaseAsset(
    release.assets || [],
    options.githubReleaseAssetName,
  );
  return {
    packageAssetName: asset.name,
    packageAssetUrl: asset.browser_download_url,
  };
}
