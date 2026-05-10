import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReleaseErrorCode, ReleaseState } from '@openupm/types';

const packageMetadataLocalExistsMock = vi.fn();
const fetchAllMock = vi.fn();
const removeReleaseRecordMock = vi.fn();
const pkgRemoveMock = vi.fn();
const relRemoveMock = vi.fn();
const getJobCountsMock = vi.fn();
const getJobsMock = vi.fn();
const getQueueMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  fetchAll: fetchAllMock,
  remove: removeReleaseRecordMock,
}));

vi.mock('../../src/queues/core.js', () => ({
  getQueue: getQueueMock,
}));

describe('cleanupMissingPackage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getQueueMock.mockImplementation((name: string) => {
      if (name === 'pkg') {
        return {
          remove: pkgRemoveMock,
          getJobCounts: getJobCountsMock,
          getJobs: getJobsMock,
        };
      }
      if (name === 'rel') return { remove: relRemoveMock };
      throw new Error(`unexpected queue: ${name}`);
    });
    pkgRemoveMock.mockResolvedValue(1);
    relRemoveMock.mockResolvedValue(1);
    removeReleaseRecordMock.mockResolvedValue(undefined);
  });

  it('removes the package job and failed releases for missing package metadata', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(false);
    fetchAllMock.mockResolvedValue([
      {
        packageName: 'com.foo.bar',
        version: '1.0.0',
        state: ReleaseState.Failed,
        reason: ReleaseErrorCode.BuildTimeout,
        buildId: '',
        tag: '1.0.0',
        commit: 'abc',
        updatedAt: 100,
      },
      {
        packageName: 'com.foo.bar',
        version: '2.0.0',
        state: ReleaseState.Succeeded,
        reason: ReleaseErrorCode.None,
        buildId: '123',
        tag: '2.0.0',
        commit: 'def',
        updatedAt: 200,
      },
    ]);

    const { cleanupMissingPackage } = await import(
      '../../src/jobs/cleanupMissingPackage.js'
    );

    const result = await cleanupMissingPackage('com.foo.bar');

    expect(pkgRemoveMock).toHaveBeenCalledWith('build-pkg|com.foo.bar', {
      removeChildren: true,
    });
    expect(relRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.foo.bar|1.0.0',
      {
        removeChildren: true,
      },
    );
    expect(removeReleaseRecordMock).toHaveBeenCalledWith('com.foo.bar', '1.0.0');
    expect(removeReleaseRecordMock).not.toHaveBeenCalledWith(
      'com.foo.bar',
      '2.0.0',
    );
    expect(result).toMatchObject({
      packageName: 'com.foo.bar',
      metadataMissing: true,
      preservedReleaseCount: 1,
      failedReleasesRemoved: [
        {
          packageName: 'com.foo.bar',
          version: '1.0.0',
          jobId: 'build-rel|com.foo.bar|1.0.0',
          jobRemoved: true,
        },
      ],
    });
  });

  it('does not remove queue or release state when package metadata still exists', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(true);

    const { cleanupMissingPackage } = await import(
      '../../src/jobs/cleanupMissingPackage.js'
    );

    const result = await cleanupMissingPackage('com.foo.bar');

    expect(pkgRemoveMock).not.toHaveBeenCalled();
    expect(fetchAllMock).not.toHaveBeenCalled();
    expect(removeReleaseRecordMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      packageName: 'com.foo.bar',
      metadataMissing: false,
      failedReleasesRemoved: [],
      preservedReleaseCount: 0,
    });
  });

  it('scans failed package jobs and cleans only packages missing from local data', async () => {
    packageMetadataLocalExistsMock.mockImplementation(
      (name: string) => name === 'com.kept.package',
    );
    getJobCountsMock.mockResolvedValue({ failed: 2 });
    getJobsMock.mockResolvedValue([
      {
        id: 'build-pkg|com.removed.package',
        data: { name: 'com.removed.package' },
      },
      {
        id: 'build-pkg|com.kept.package',
        data: { name: 'com.kept.package' },
      },
    ]);
    fetchAllMock.mockResolvedValue([]);

    const { cleanupMissingPackageJobs } = await import(
      '../../src/jobs/cleanupMissingPackage.js'
    );

    const result = await cleanupMissingPackageJobs();

    expect(getJobsMock).toHaveBeenCalledWith(['failed'], 0, 1, false);
    expect(pkgRemoveMock).toHaveBeenCalledTimes(1);
    expect(pkgRemoveMock).toHaveBeenCalledWith(
      'build-pkg|com.removed.package',
      {
        removeChildren: true,
      },
    );
    expect(result.cleaned).toHaveLength(1);
    expect(result.skipped).toEqual(['com.kept.package']);
  });
});
