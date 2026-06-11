import { PublicTrends } from '@openupm/types';

import redis from '../redis.js';

const REDIS_KEY_PUBLIC_TRENDS = 'trends:latest';

export async function setPublicTrends(trends: PublicTrends): Promise<void> {
  await redis.client!.set(REDIS_KEY_PUBLIC_TRENDS, JSON.stringify(trends));
}

export async function getPublicTrends(): Promise<PublicTrends | null> {
  const jsonText = await redis.client!.get(REDIS_KEY_PUBLIC_TRENDS);
  if (!jsonText) return null;
  return JSON.parse(jsonText) as PublicTrends;
}
