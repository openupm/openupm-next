type HealthcheckState = 'start' | 'success' | 'fail';

type HealthcheckLogger = {
  debug?: (fields: object, message: string) => void;
  warn?: (fields: object, message: string) => void;
};

function getPingUrl(pingUrl: string, state: HealthcheckState): string {
  const trimmed = pingUrl.replace(/\/+$/, '');
  return state === 'success' ? trimmed : `${trimmed}/${state}`;
}

export async function pingHealthcheck(
  pingUrl: string | undefined,
  state: HealthcheckState,
  logger?: HealthcheckLogger,
  timeoutMs = 10000,
): Promise<void> {
  if (!pingUrl) return;

  const url = getPingUrl(pingUrl, state);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Healthcheck ping failed: ${response.status}`);
    }
    logger?.debug?.({ state, url }, 'Healthcheck ping succeeded.');
  } catch (err) {
    logger?.warn?.({ err, state, url }, 'Healthcheck ping failed.');
  } finally {
    clearTimeout(timeout);
  }
}
