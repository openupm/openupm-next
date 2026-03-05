import { beforeEach, describe, expect, it, vi } from 'vitest';

const buildPackageMock = vi.fn();
const buildReleaseMock = vi.fn();

vi.mock('../../src/workers/buildPackage.js', () => ({
  buildPackage: buildPackageMock,
}));

vi.mock('../../src/workers/buildRelease.js', () => ({
  buildRelease: buildReleaseMock,
}));

describe('processJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('dispatches build package job', async () => {
    const { processJob } = await import('../../src/queues/process.js');
    await processJob({ name: 'build-pkg', data: { name: 'com.a' } } as never);
    expect(buildPackageMock).toHaveBeenCalledWith('com.a');
  });

  it('dispatches build release job', async () => {
    const { processJob } = await import('../../src/queues/process.js');
    await processJob({
      name: 'build-rel',
      data: { name: 'com.a', version: '1.0.0' },
    } as never);
    expect(buildReleaseMock).toHaveBeenCalledWith('com.a', '1.0.0');
  });
});
