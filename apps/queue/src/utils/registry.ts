import configRaw from 'config';
import superagent from 'superagent';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

function getPackumentUrl(packageName: string): string {
  const baseUrl = String(config.registry.url).replace(/\/+$/, '');
  return `${baseUrl}/${encodeURIComponent(packageName)}`;
}

export async function isReleasePublished(
  packageName: string,
  version: string,
): Promise<boolean> {
  try {
    const response = await superagent
      .get(getPackumentUrl(packageName))
      .accept('json')
      .timeout(config.registry.requestTimeoutMs);
    const body = response.body as unknown;
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new Error(
        `Registry returned an invalid packument for ${packageName}`,
      );
    }
    const versions = (body as { versions?: unknown }).versions;
    if (
      typeof versions !== 'object' ||
      versions === null ||
      Array.isArray(versions)
    ) {
      throw new Error(
        `Registry returned an invalid packument for ${packageName}`,
      );
    }
    if ((body as { name?: unknown }).name !== packageName) {
      throw new Error(
        `Registry returned an invalid packument for ${packageName}`,
      );
    }
    if (!Object.prototype.hasOwnProperty.call(versions, version)) return false;

    const manifest = (versions as Record<string, unknown>)[version];
    if (
      typeof manifest !== 'object' ||
      manifest === null ||
      Array.isArray(manifest) ||
      (manifest as { name?: unknown }).name !== packageName ||
      (manifest as { version?: unknown }).version !== version
    ) {
      throw new Error(
        `Registry returned an invalid manifest for ${packageName}@${version}`,
      );
    }
    return true;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 404
    ) {
      return false;
    }
    throw error;
  }
}
