import configRaw from 'config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export class PublishTriggerRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('The package refresh trigger rate limit was exceeded.');
  }
}

function rateLimitConfig(): {
  enabled: boolean;
  max: number;
  windowMs: number;
} {
  const raw = config.publishTrigger?.rateLimit || {};
  return {
    enabled: raw.enabled !== false,
    max: raw.max ?? 20,
    windowMs: raw.windowMs ?? 60 * 60 * 1000,
  };
}

export function resetPublishTriggerRateLimitForTests(): void {
  buckets.clear();
}

export function assertPublishTriggerRateLimit(params: {
  packageName: string;
  repository: string;
  ip: string;
  now?: number;
}): void {
  const rateLimit = rateLimitConfig();
  if (!rateLimit.enabled || rateLimit.max <= 0 || rateLimit.windowMs <= 0) {
    return;
  }

  const now = params.now ?? Date.now();
  const key = [
    params.packageName,
    params.repository.toLowerCase(),
    params.ip || 'unknown',
  ].join('|');
  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + rateLimit.windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > rateLimit.max) {
    throw new PublishTriggerRateLimitError(
      Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    );
  }
}
