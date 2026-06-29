import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageNamesMock = vi.fn();
const packageMetadataLocalExistsMock = vi.fn();
const loadPackageMetadataLocalMock = vi.fn();

const setUnityVersionMock = vi.fn();
const setUpdatedTimeMock = vi.fn();
const setVersionMock = vi.fn();
const setScopesMock = vi.fn();
const setStarsMock = vi.fn();
const setParentStarsMock = vi.fn();
const setRepoPushedTimeMock = vi.fn();
const setRepoUpdatedTimeMock = vi.fn();
const setRepoUnavailableMock = vi.fn();
const setRepoArchivedMock = vi.fn();
const setMonthlyDownloadsMock = vi.fn();
const getReadmeCacheKeyMock = vi.fn();
const setReadmeMock = vi.fn();
const setReadmeHtmlMock = vi.fn();
const setReadmeCacheKeyMock = vi.fn();
const setReadmeUpdatedAtMock = vi.fn();
const getImageQueryForPackageMock = vi.fn();
const getImageQueryForGithubUserMock = vi.fn();

const getImageMock = vi.fn();
const addImageMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageNames: loadPackageNamesMock,
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  setUnityVersion: setUnityVersionMock,
  setUpdatedTime: setUpdatedTimeMock,
  setVersion: setVersionMock,
  setScopes: setScopesMock,
  setStars: setStarsMock,
  setParentStars: setParentStarsMock,
  setRepoPushedTime: setRepoPushedTimeMock,
  setRepoUpdatedTime: setRepoUpdatedTimeMock,
  setRepoUnavailable: setRepoUnavailableMock,
  setRepoArchived: setRepoArchivedMock,
  setMonthlyDownloads: setMonthlyDownloadsMock,
  getReadmeCacheKey: getReadmeCacheKeyMock,
  setReadme: setReadmeMock,
  setReadmeHtml: setReadmeHtmlMock,
  setReadmeCacheKey: setReadmeCacheKeyMock,
  setReadmeUpdatedAt: setReadmeUpdatedAtMock,
  getImageQueryForPackage: getImageQueryForPackageMock,
  getImageQueryForGithubUser: getImageQueryForGithubUserMock,
  getCachedImageFilename: vi.fn().mockResolvedValue(null),
}));

vi.mock('@openupm/server-common/build/utils/media.js', () => ({
  getImage: getImageMock,
  addImage: addImageMock,
}));

describe('fetchPackageExtraJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches README source content and renders it locally', async () => {
    getReadmeCacheKeyMock.mockResolvedValue('v0:main:README.md:old');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: Buffer.from('README without title').toString('base64'),
          encoding: 'base64',
        }),
      });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageReadme } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageReadme(
      {
        name: 'com.test.pkg',
        displayName: 'Test Package',
        description: 'Description',
        repo: 'openupm/test-package',
        repoUrl: 'https://github.com/openupm/test-package',
        readme: 'main:README.md',
        readmeBranch: 'main',
      },
      'com.test.pkg',
      1767225600000,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/openupm/test-package/contents/README.md?ref=main',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/markdown')),
    ).toBe(false);
    expect(setReadmeMock).toHaveBeenCalledWith(
      'com.test.pkg',
      'README without title',
    );
    expect(setReadmeHtmlMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.stringContaining('<h1 id="test-package">Test Package</h1>'),
    );
    expect(setReadmeCacheKeyMock).toHaveBeenCalledWith(
      'com.test.pkg',
      'en-US',
      'v0:main:README.md:1767225600000',
    );
    expect(setReadmeUpdatedAtMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.any(Number),
    );
  });

  it('skips README content fetch on cache hit', async () => {
    getReadmeCacheKeyMock.mockResolvedValue('v0:main:README.md:1767225600000');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageReadme } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageReadme(
      {
        name: 'com.test.pkg',
        repo: 'openupm/test-package',
        repoUrl: 'https://github.com/openupm/test-package',
        readme: 'main:README.md',
        readmeBranch: 'main',
      },
      'com.test.pkg',
      1767225600000,
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setReadmeMock).not.toHaveBeenCalled();
    expect(setReadmeHtmlMock).not.toHaveBeenCalled();
    expect(setReadmeUpdatedAtMock).not.toHaveBeenCalled();
  });

  it('stores fallback README content on GitHub content 404', async () => {
    getReadmeCacheKeyMock.mockResolvedValue('v0:main:README.md:old');
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageReadme } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageReadme(
      {
        name: 'com.test.pkg',
        displayName: 'Test Package',
        description: 'Description',
        repo: 'openupm/test-package',
        repoUrl: 'https://github.com/openupm/test-package',
        readme: 'main:README.md',
        readmeBranch: 'main',
      },
      'com.test.pkg',
      1767225600000,
    );

    expect(setReadmeMock).toHaveBeenCalledWith('com.test.pkg', '');
    expect(setReadmeHtmlMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.stringContaining('See more in the'),
    );
    expect(setReadmeCacheKeyMock).toHaveBeenCalledWith(
      'com.test.pkg',
      'en-US',
      'v0:main:README.md:1767225600000',
    );
    expect(setReadmeUpdatedAtMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.any(Number),
    );
  });

  it('stores fallback README content for empty GitHub content', async () => {
    getReadmeCacheKeyMock.mockResolvedValue('v0:main:README.md:old');
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: '',
        encoding: 'base64',
      }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageReadme } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageReadme(
      {
        name: 'com.test.pkg',
        displayName: 'Test Package',
        description: 'Description',
        repo: 'openupm/test-package',
        repoUrl: 'https://github.com/openupm/test-package',
        readme: 'main:README.md',
        readmeBranch: 'main',
      },
      'com.test.pkg',
      1767225600000,
    );

    expect(setReadmeMock).toHaveBeenCalledWith('com.test.pkg', '');
    expect(setReadmeHtmlMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.stringContaining('<h1 id="test-package">Test Package</h1>'),
    );
    expect(setReadmeCacheKeyMock).toHaveBeenCalledWith(
      'com.test.pkg',
      'en-US',
      'v0:main:README.md:1767225600000',
    );
  });

  it('fetches custom README branch and path metadata', async () => {
    getReadmeCacheKeyMock.mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: Buffer.from('[link](relative)').toString('base64'),
        encoding: 'base64',
      }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageReadme } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageReadme(
      {
        name: 'com.test.pkg',
        repo: 'openupm/test-package',
        repoUrl: 'https://github.com/openupm/test-package',
        readme: 'upm:.github/README.md',
        readmeBranch: 'upm',
      },
      'com.test.pkg',
      1767225600000,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/openupm/test-package/contents/.github/README.md?ref=upm',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(setReadmeHtmlMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.stringContaining(
        'href="https://github.com/openupm/test-package/blob/upm/.github/relative"',
      ),
    );
    expect(setReadmeCacheKeyMock).toHaveBeenCalledWith(
      'com.test.pkg',
      'en-US',
      'v0:upm:.github/README.md:1767225600000',
    );
  });

  it('loads all package names when all=true', async () => {
    loadPackageNamesMock.mockResolvedValue(['com.test.pkg']);
    packageMetadataLocalExistsMock.mockReturnValue(true);
    loadPackageMetadataLocalMock.mockResolvedValue({
      repo: 'openupm/openupm',
      repoUrl: 'https://github.com/openupm/openupm',
      owner: 'openupm',
      parentOwner: null,
      hunter: 'openupm',
    });

    getImageQueryForPackageMock.mockResolvedValue(null);
    getImageQueryForGithubUserMock.mockResolvedValue({
      imageUrl: 'https://github.com/openupm.png?size=48',
      width: 48,
      height: 48,
      fit: 'cover',
    });
    getImageMock.mockResolvedValue({ available: true });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { unity: '2021.3', dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stargazers_count: 10,
          archived: false,
          pushed_at: '2026-01-01T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          downloads: [
            { day: '2026-01-01', downloads: 8 },
            { day: '2026-01-02', downloads: 12 },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageExtraJob } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageExtraJob(null, { all: true, force: false });

    expect(loadPackageNamesMock).toHaveBeenCalledWith({ sortKey: '-mtime' });
    expect(setVersionMock).toHaveBeenCalledWith('com.test.pkg', '1.0.0');
    expect(setScopesMock).toHaveBeenCalled();
    expect(setStarsMock).toHaveBeenCalledWith('com.test.pkg', 10);
    expect(setRepoArchivedMock).toHaveBeenCalledWith('com.test.pkg', false);
    expect(setMonthlyDownloadsMock).toHaveBeenCalledWith('com.test.pkg', 20);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/downloads/point/last-month/com.test.pkg'),
      expect.any(Object),
    );
  });

  it('stores README fallback when repo metadata is unavailable', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(true);
    loadPackageMetadataLocalMock.mockResolvedValue({
      name: 'com.test.pkg',
      displayName: 'Test Package',
      description: 'Description',
      repo: 'missing-package',
      repoUrl: 'https://github.com/openupm/missing-package',
      readme: 'main:README.md',
      owner: null,
      parentOwner: null,
      hunter: null,
    });
    getReadmeCacheKeyMock.mockResolvedValue(null);
    getImageQueryForPackageMock.mockResolvedValue(null);
    getImageQueryForGithubUserMock.mockResolvedValue(null);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ downloads: 0 }),
      });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageExtraJob } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageExtraJob(['com.test.pkg'], { force: false });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/openupm/missing-package',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(setRepoUnavailableMock).toHaveBeenCalledWith('com.test.pkg', true);
    expect(setReadmeMock).toHaveBeenCalledWith('com.test.pkg', '');
    expect(setReadmeHtmlMock).toHaveBeenCalledWith(
      'com.test.pkg',
      expect.stringContaining('See more in the'),
    );
    expect(setReadmeCacheKeyMock).toHaveBeenCalledWith(
      'com.test.pkg',
      'en-US',
      'v0:main:README.md:unavailable',
    );
    expect(setRepoArchivedMock).not.toHaveBeenCalled();
  });

  it('stores archived repository metadata from successful GitHub repo responses', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(true);
    loadPackageMetadataLocalMock.mockResolvedValue({
      name: 'com.test.pkg',
      repo: 'openupm/archived-package',
      repoUrl: 'https://github.com/openupm/archived-package',
      owner: null,
      parentOwner: null,
      hunter: null,
    });
    getReadmeCacheKeyMock.mockResolvedValue('v0:main:README.md:1767225600000');
    getImageQueryForPackageMock.mockResolvedValue(null);
    getImageQueryForGithubUserMock.mockResolvedValue(null);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' },
          versions: { '1.0.0': { dependencies: {} } },
          time: { '1.0.0': '2026-01-01T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          archived: true,
          stargazers_count: 10,
          pushed_at: '2026-01-01T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ downloads: 0 }),
      });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchPackageExtraJob } = await import('../../src/jobs/fetchPackageExtra.js');
    await fetchPackageExtraJob(['com.test.pkg'], { force: false });

    expect(setRepoUnavailableMock).toHaveBeenCalledWith('com.test.pkg', false);
    expect(setRepoArchivedMock).toHaveBeenCalledWith('com.test.pkg', true);
  });

  it('cacheAvatarImageForGithubUser should add image when cache unavailable', async () => {
    getImageQueryForGithubUserMock.mockResolvedValue({
      imageUrl: 'https://github.com/bob.png?size=48',
      width: 48,
      height: 48,
      fit: 'cover',
    });
    getImageMock.mockResolvedValue(null);

    const { cacheAvatarImageForGithubUser } = await import('../../src/jobs/fetchPackageExtra.js');
    await cacheAvatarImageForGithubUser('bob', false);

    expect(addImageMock).toHaveBeenCalled();
  });
});
