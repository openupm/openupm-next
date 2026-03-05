import { beforeEach, describe, expect, it, vi } from 'vitest';

const getImageQueryForGithubUserMock = vi.fn();
const getImageMock = vi.fn();
const addImageMock = vi.fn();

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  getImageQueryForGithubUser: getImageQueryForGithubUserMock,
}));

vi.mock('@openupm/server-common/build/utils/media.js', () => ({
  getImage: getImageMock,
  addImage: addImageMock,
}));

describe('cacheAvatarImageForGithubUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should skip addImage when cache is available and force=false', async () => {
    getImageQueryForGithubUserMock.mockResolvedValue({
      imageUrl: 'https://github.com/alice.png?size=48',
      width: 48,
      height: 48,
      fit: 'cover',
    });
    getImageMock.mockResolvedValue({ available: true, filename: 'alice-48x48.png' });

    const { cacheAvatarImageForGithubUser } = await import('../../src/jobs/fetchPackageExtra.js');
    await cacheAvatarImageForGithubUser('alice', false);

    expect(addImageMock).not.toHaveBeenCalled();
  });

  it('should add image when cache is not available', async () => {
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
