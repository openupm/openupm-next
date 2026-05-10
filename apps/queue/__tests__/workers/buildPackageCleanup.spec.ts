import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadPackageMetadataLocalMock = vi.fn();
const packageMetadataLocalExistsMock = vi.fn();
const cleanupMissingPackageMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  loadPackageMetadataLocal: loadPackageMetadataLocalMock,
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
}));

vi.mock('../../src/jobs/cleanupMissingPackage.js', () => ({
  cleanupMissingPackage: cleanupMissingPackageMock,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  fetchAll: vi.fn(),
  fetchOne: vi.fn(),
  remove: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@openupm/server-common/build/models/packageExtra.js', () => ({
  setInvalidTags: vi.fn(),
  setRepoUnavailable: vi.fn(),
}));

vi.mock('../../src/queues/core.js', () => ({
  addJob: vi.fn(),
  getQueue: vi.fn(),
}));

vi.mock('../../src/utils/git.js', () => ({
  gitListRemoteTags: vi.fn(),
}));

describe('buildPackage missing metadata cleanup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    loadPackageMetadataLocalMock.mockResolvedValue(null);
    packageMetadataLocalExistsMock.mockReturnValue(false);
    cleanupMissingPackageMock.mockResolvedValue(undefined);
  });

  it('cleans missing package state and resolves without throwing', async () => {
    const { buildPackage } = await import('../../src/workers/buildPackage.js');

    await expect(buildPackage('com.removed.package')).resolves.toBeUndefined();

    expect(cleanupMissingPackageMock).toHaveBeenCalledWith(
      'com.removed.package',
    );
  });

  it('throws when metadata fails to load but still exists', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(true);
    const { buildPackage } = await import('../../src/workers/buildPackage.js');

    await expect(buildPackage('com.invalid.package')).rejects.toThrow(
      'package not found: com.invalid.package',
    );

    expect(cleanupMissingPackageMock).not.toHaveBeenCalled();
  });
});
