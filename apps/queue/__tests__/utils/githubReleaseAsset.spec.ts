import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReleaseErrorCode } from '@openupm/types';
import {
  GitHubReleaseAssetError,
  parseGitHubRepoUrl,
  resolveGitHubReleaseAsset,
  selectGitHubReleaseAsset,
} from '../../src/utils/githubReleaseAsset.js';

describe('githubReleaseAsset utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses GitHub repo URLs', () => {
    expect(parseGitHubRepoUrl('https://github.com/openupm/openupm.git')).toEqual({
      owner: 'openupm',
      repo: 'openupm',
    });
    expect(parseGitHubRepoUrl('git@github.com:openupm/openupm.git')).toEqual({
      owner: 'openupm',
      repo: 'openupm',
    });
    expect(parseGitHubRepoUrl('https://example.com/openupm/openupm')).toBeNull();
  });

  it('selects configured publishable asset by exact name', () => {
    const asset = selectGitHubReleaseAsset(
      [
        { name: 'package.tgz', browser_download_url: 'https://example.com/a' },
        {
          name: 'package.tar.gz',
          browser_download_url: 'https://example.com/b',
        },
      ],
      'package.tar.gz',
    );

    expect(asset.browser_download_url).toEqual('https://example.com/b');
  });

  it('selects configured asset by stable prefix when exact name is absent', () => {
    const asset = selectGitHubReleaseAsset(
      [
        {
          name: 'com.example.package-1.0.0.tgz',
          browser_download_url: 'https://example.com/a',
        },
        {
          name: 'com.example.other-1.0.0.tgz',
          browser_download_url: 'https://example.com/b',
        },
      ],
      'com.example.package-',
    );

    expect(asset.name).toEqual('com.example.package-1.0.0.tgz');
  });

  it('prefers exact configured asset name over prefix matches', () => {
    const asset = selectGitHubReleaseAsset(
      [
        {
          name: 'com.example.package.tgz',
          browser_download_url: 'https://example.com/a',
        },
        {
          name: 'com.example.package-extra.tgz',
          browser_download_url: 'https://example.com/b',
        },
      ],
      'com.example.package.tgz',
    );

    expect(asset.browser_download_url).toEqual('https://example.com/a');
  });

  it('rejects ambiguous configured asset prefixes', () => {
    expect(() =>
      selectGitHubReleaseAsset(
        [
          {
            name: 'com.example.package-1.0.0.tgz',
            browser_download_url: 'https://example.com/a',
          },
          {
            name: 'com.example.package-1.0.0-symbols.tgz',
            browser_download_url: 'https://example.com/b',
          },
        ],
        'com.example.package-',
      ),
    ).toThrowError(GitHubReleaseAssetError);
  });

  it('selects the only publishable asset when name is omitted', () => {
    const asset = selectGitHubReleaseAsset([
      { name: 'notes.txt', browser_download_url: 'https://example.com/a' },
      { name: 'package.tar.gz', browser_download_url: 'https://example.com/b' },
    ]);

    expect(asset.name).toEqual('package.tar.gz');
  });

  it('ignores GitHub generated source archive links when selecting release assets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            tag_name: 'v1.0.0',
            zipball_url: 'https://api.github.com/repos/openupm/openupm/zipball/v1.0.0',
            tarball_url: 'https://api.github.com/repos/openupm/openupm/tarball/v1.0.0',
            assets: [
              {
                name: 'package.tgz',
                browser_download_url: 'https://example.com/package.tgz',
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      resolveGitHubReleaseAsset({
        config: {},
        repoUrl: 'https://github.com/openupm/openupm',
        releaseTag: 'v1.0.0',
      }),
    ).resolves.toEqual({
      packageAssetName: 'package.tgz',
      packageAssetUrl: 'https://example.com/package.tgz',
    });
  });

  it('rejects ambiguous publishable assets', () => {
    expect(() =>
      selectGitHubReleaseAsset([
        { name: 'one.tgz', browser_download_url: 'https://example.com/a' },
        { name: 'two.tar.gz', browser_download_url: 'https://example.com/b' },
      ]),
    ).toThrowError(GitHubReleaseAssetError);
  });

  it('resolves release asset with GitHub token headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          tag_name: 'v1.0.0',
          assets: [
            {
              name: 'package.tgz',
              browser_download_url: 'https://example.com/package.tgz',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const resolved = await resolveGitHubReleaseAsset({
      config: { github: { tokens: ['token-a'] } },
      repoUrl: 'https://github.com/openupm/openupm',
      releaseTag: 'v1.0.0',
    });

    expect(resolved).toEqual({
      packageAssetName: 'package.tgz',
      packageAssetUrl: 'https://example.com/package.tgz',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/openupm/openupm/releases/tags/v1.0.0',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-a' }),
      }),
    );
  });

  it('maps missing release to retryable reason', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 404 })),
    );

    await expect(
      resolveGitHubReleaseAsset({
        config: {},
        repoUrl: 'https://github.com/openupm/openupm',
        releaseTag: 'v1.0.0',
      }),
    ).rejects.toMatchObject({
      reason: ReleaseErrorCode.GitHubReleaseNotFound,
    });
  });

  it('maps invalid GitHub API JSON to retryable API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })),
    );

    await expect(
      resolveGitHubReleaseAsset({
        config: {},
        repoUrl: 'https://github.com/openupm/openupm',
        releaseTag: 'v1.0.0',
      }),
    ).rejects.toMatchObject({
      reason: ReleaseErrorCode.GitHubReleaseApiError,
    });
  });
});
