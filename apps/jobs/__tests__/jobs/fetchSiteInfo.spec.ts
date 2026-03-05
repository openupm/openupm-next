import { beforeEach, describe, expect, it, vi } from 'vitest';

const setStarsMock = vi.fn();

vi.mock('@openupm/server-common/build/models/siteInfo.js', () => ({
  setStars: setStarsMock,
}));

describe('fetchSiteInfoJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetchGitHubStars should parse stargazers_count', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 123 }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchGitHubStars } = await import('../../src/jobs/fetchSiteInfo.js');
    const stars = await fetchGitHubStars('openupm/openupm');

    expect(stars).toEqual(123);
  });

  it('fetchSiteInfoJob should store stars', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 456 }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { fetchSiteInfoJob } = await import('../../src/jobs/fetchSiteInfo.js');
    await fetchSiteInfoJob('openupm/openupm');

    expect(setStarsMock).toHaveBeenCalledWith(456);
  });
});
