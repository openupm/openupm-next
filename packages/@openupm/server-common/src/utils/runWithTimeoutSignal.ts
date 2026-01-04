import { AbortController, AbortSignal } from 'abort-controller';

const DEFAULT_TIMEOUT = 10000; // ms

/**
 * Run a function with a timeout signal.
 * @param fn The function to run with a timeout signal.
 * @param timeout The timeout in milliseconds.
 */
export async function runWithTimeoutSignal<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeout?: number,
): Promise<T> {
  const controller = new AbortController();
  const signal = controller.signal;
  if (!timeout) timeout = DEFAULT_TIMEOUT;
  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);
  if (typeof timer.unref === 'function') timer.unref();
  try {
    return await fn(signal);
  } finally {
    clearTimeout(timer);
  }
}
