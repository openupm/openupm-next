import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReleaseErrorCode, ReleaseState } from '@openupm/types';

const packageMetadataLocalExistsMock = vi.fn();
const fetchAllMock = vi.fn();
const fetchOneMock = vi.fn();
const removeReleaseRecordMock = vi.fn();
const pkgRemoveMock = vi.fn();
const relRemoveMock = vi.fn();
const pkgGetJobCountsMock = vi.fn();
const pkgGetJobsMock = vi.fn();
const relGetJobCountsMock = vi.fn();
const relGetJobsMock = vi.fn();
const getQueueMock = vi.fn();

vi.mock('@openupm/local-data', () => ({
  packageMetadataLocalExists: packageMetadataLocalExistsMock,
}));

vi.mock('@openupm/server-common/build/models/release.js', () => ({
  fetchAll: fetchAllMock,
  fetchOne: fetchOneMock,
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
          getJobCounts: pkgGetJobCountsMock,
          getJobs: pkgGetJobsMock,
        };
      }
      if (name === 'rel') {
        return {
          remove: relRemoveMock,
          getJobCounts: relGetJobCountsMock,
          getJobs: relGetJobsMock,
        };
      }
      throw new Error(`unexpected queue: ${name}`);
    });
    pkgRemoveMock.mockResolvedValue(1);
    relRemoveMock.mockResolvedValue(1);
    removeReleaseRecordMock.mockResolvedValue(undefined);
    fetchOneMock.mockResolvedValue(null);
    pkgGetJobCountsMock.mockResolvedValue({ failed: 0 });
    pkgGetJobsMock.mockResolvedValue([]);
    relGetJobCountsMock.mockResolvedValue({ failed: 0 });
    relGetJobsMock.mockResolvedValue([]);
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
    pkgGetJobCountsMock.mockResolvedValue({ failed: 2 });
    pkgGetJobsMock.mockResolvedValue([
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

    expect(pkgGetJobsMock).toHaveBeenCalledWith(['failed'], 0, 1, false);
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

  it('removes failed release jobs whose package is missing from local data', async () => {
    packageMetadataLocalExistsMock.mockImplementation(
      (name: string) => name === 'com.kept.package',
    );
    relGetJobCountsMock.mockResolvedValue({ failed: 2 });
    relGetJobsMock.mockResolvedValue([
      {
        id: 'build-rel|com.removed.package|1.0.0',
        data: { name: 'com.removed.package', version: '1.0.0' },
      },
      {
        id: 'build-rel|com.kept.package|2.0.0',
        data: { name: 'com.kept.package', version: '2.0.0' },
      },
    ]);
    fetchOneMock.mockResolvedValue({
      packageName: 'com.removed.package',
      version: '1.0.0',
      state: ReleaseState.Failed,
      reason: ReleaseErrorCode.BuildTimeout,
      buildId: '',
      tag: '1.0.0',
      commit: 'abc',
      updatedAt: 100,
    });

    const { cleanupMissingPackageJobs } = await import(
      '../../src/jobs/cleanupMissingPackage.js'
    );

    const result = await cleanupMissingPackageJobs();

    expect(relGetJobsMock).toHaveBeenCalledWith(['failed'], 0, 1, false);
    expect(relRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.removed.package|1.0.0',
      { removeChildren: true },
    );
    expect(relRemoveMock).not.toHaveBeenCalledWith(
      'build-rel|com.kept.package|2.0.0',
      { removeChildren: true },
    );
    expect(removeReleaseRecordMock).toHaveBeenCalledWith(
      'com.removed.package',
      '1.0.0',
    );
    expect(result.releaseJobs).toMatchObject({
      queue: 'rel',
      scanned: 2,
      skipped: ['com.kept.package@2.0.0'],
      cleaned: [
        {
          packageName: 'com.removed.package',
          version: '1.0.0',
          jobId: 'build-rel|com.removed.package|1.0.0',
          jobRemoved: true,
          releaseRecordRemoved: true,
        },
      ],
    });
  });

  it('keeps a successful release record when its failed release job is orphaned', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(false);
    relGetJobCountsMock.mockResolvedValue({ failed: 1 });
    relGetJobsMock.mockResolvedValue([
      {
        id: 'build-rel|com.removed.package|3.0.0',
        data: { name: 'com.removed.package', version: '3.0.0' },
      },
    ]);
    fetchOneMock.mockResolvedValue({
      packageName: 'com.removed.package',
      version: '3.0.0',
      state: ReleaseState.Succeeded,
      reason: ReleaseErrorCode.None,
      buildId: '123',
      tag: '3.0.0',
      commit: 'def',
      updatedAt: 200,
    });

    const { cleanupMissingPackageJobs } = await import(
      '../../src/jobs/cleanupMissingPackage.js'
    );

    const result = await cleanupMissingPackageJobs();

    expect(relRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.removed.package|3.0.0',
      { removeChildren: true },
    );
    expect(removeReleaseRecordMock).not.toHaveBeenCalled();
    expect(result.releaseJobs.cleaned[0]).toMatchObject({
      jobRemoved: true,
      releaseRecordRemoved: false,
    });
  });

  it('derives the release from the job id when job data is missing', async () => {
    packageMetadataLocalExistsMock.mockReturnValue(false);
    relGetJobCountsMock.mockResolvedValue({ failed: 1 });
    relGetJobsMock.mockResolvedValue([
      { id: 'build-rel|com.removed.package|1.0.0' },
    ]);

    const { cleanupMissingPackageJobs } = await import(
      '../../src/jobs/cleanupMissingPackage.js'
    );

    const result = await cleanupMissingPackageJobs();

    expect(relRemoveMock).toHaveBeenCalledWith(
      'build-rel|com.removed.package|1.0.0',
      { removeChildren: true },
    );
    expect(result.releaseJobs.cleaned).toHaveLength(1);
  });
});
