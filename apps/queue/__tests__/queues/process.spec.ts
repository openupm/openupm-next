import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  afterEach(() => {
    vi.useRealTimers();
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

  it('uses configured package and release job timeouts', async () => {
    const { getConfigJobTimeoutMs } = await import(
      '../../src/queues/process.js'
    );

    expect(getConfigJobTimeoutMs('build-pkg')).toBe(300000);
    expect(getConfigJobTimeoutMs('build-rel')).toBe(1800000);
    expect(getConfigJobTimeoutMs('unknown')).toBe(60000);
  });

  it('throws when job processing exceeds the configured timeout', async () => {
    vi.useFakeTimers();
    const { runWithJobTimeout } = await import('../../src/queues/process.js');
    const processor = vi.fn(() => new Promise<void>(() => {}));

    const result = runWithJobTimeout(
      { id: '42', name: 'build-pkg' } as never,
      processor as never,
    );
    const expectation = expect(result).rejects.toThrow(
      'Job build-pkg 42 timed out after 300000ms',
    );
    await vi.advanceTimersByTimeAsync(300000);
    await expectation;
  });

  it('does not timeout unknown jobs that complete immediately', async () => {
    vi.useFakeTimers();
    const { jobHandler } = await import('../../src/queues/process.js');

    await jobHandler({ id: '43', name: 'unknown', data: {} } as never);

    expect(buildPackageMock).not.toHaveBeenCalled();
    expect(buildReleaseMock).not.toHaveBeenCalled();
  });
});
