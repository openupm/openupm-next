import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheAvatarImageForGithubUserMock = vi.fn();

vi.mock('../../src/jobs/fetchPackageExtra.js', () => ({
  cacheAvatarImageForGithubUser: cacheAvatarImageForGithubUserMock,
}));

describe('fetchBackerDataJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should cache avatar for backers with github user', async () => {
    const { fetchBackerDataJob } = await import('../../src/jobs/fetchBackerData.js');

    await fetchBackerDataJob(true, {
      items: [{ githubUser: 'alice' }, {}, { githubUser: 'bob' }],
    });

    expect(cacheAvatarImageForGithubUserMock).toHaveBeenCalledTimes(2);
    expect(cacheAvatarImageForGithubUserMock).toHaveBeenNthCalledWith(1, 'alice', true);
    expect(cacheAvatarImageForGithubUserMock).toHaveBeenNthCalledWith(2, 'bob', true);
  });
});
