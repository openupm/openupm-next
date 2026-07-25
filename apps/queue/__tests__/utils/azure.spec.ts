import { describe, expect, it, vi } from 'vitest';

import { AzureBuildNotFoundError, waitBuild } from '../../src/utils/azure.js';

describe('waitBuild', () => {
  it('classifies a null Azure response as a missing build', async () => {
    const buildApi = {
      getBuild: vi.fn().mockResolvedValue(null),
    };

    await expect(waitBuild(buildApi, 'missing-build')).rejects.toEqual(
      new AzureBuildNotFoundError('missing-build'),
    );
  });

  it('classifies an Azure 404 error as a missing build', async () => {
    const buildApi = {
      getBuild: vi.fn().mockRejectedValue({ statusCode: 404 }),
    };

    await expect(waitBuild(buildApi, 'deleted-build')).rejects.toEqual(
      new AzureBuildNotFoundError('deleted-build'),
    );
  });

  it('preserves non-404 Azure errors', async () => {
    const error = Object.assign(new Error('unavailable'), { statusCode: 503 });
    const buildApi = {
      getBuild: vi.fn().mockRejectedValue(error),
    };

    await expect(waitBuild(buildApi, '123')).rejects.toBe(error);
  });
});
