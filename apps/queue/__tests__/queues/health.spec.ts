import { beforeEach, describe, expect, it, vi } from 'vitest';

const closeQueuesMock = vi.fn();
const getQueueMock = vi.fn();
const hasQueueMock = vi.fn();
const getJobCountsMock = vi.fn();
const waitUntilReadyMock = vi.fn();

vi.mock('../../src/queues/core.js', () => ({
  closeQueues: closeQueuesMock,
  getQueue: getQueueMock,
  hasQueue: hasQueueMock,
}));

describe('queue healthcheck', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    hasQueueMock.mockReturnValue(true);
    getQueueMock.mockReturnValue({
      waitUntilReady: waitUntilReadyMock,
      getJobCounts: getJobCountsMock,
    });
  });

  it('checks BullMQ readiness and job count access for requested queues', async () => {
    const { runQueueHealthcheck } = await import('../../src/queues/health.js');

    await runQueueHealthcheck(['pkg']);

    expect(getQueueMock).toHaveBeenCalledWith('pkg');
    expect(waitUntilReadyMock).toHaveBeenCalled();
    expect(getJobCountsMock).toHaveBeenCalledWith(
      'waiting',
      'active',
      'delayed',
      'failed',
    );
    expect(closeQueuesMock).toHaveBeenCalled();
  });

  it('defaults to package and release queues', async () => {
    const { runQueueHealthcheck } = await import('../../src/queues/health.js');

    await runQueueHealthcheck([]);

    expect(getQueueMock).toHaveBeenNthCalledWith(1, 'pkg');
    expect(getQueueMock).toHaveBeenNthCalledWith(2, 'rel');
  });

  it('rejects unknown queue names and still closes queues', async () => {
    hasQueueMock.mockReturnValue(false);
    const { runQueueHealthcheck } = await import('../../src/queues/health.js');

    await expect(runQueueHealthcheck(['unknown'])).rejects.toThrow(
      'Can not recognize settings for queue name=unknown.',
    );
    expect(closeQueuesMock).toHaveBeenCalled();
  });
});
