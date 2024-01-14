import redis from '../redis.js';

const siteInfoKey: string = 'site:info';
const propKeys: { [key: string]: string } = {
  stars: 'stars',
};

export const setStars = async function (stars: number): Promise<void> {
  await setValue(propKeys.stars, stars.toString());
};

export const getStars = async function (): Promise<number> {
  const text: string | null = await getValue(propKeys.stars);
  return parseInt(text || '0');
};

const setValue = async function (
  propKey: string,
  propVal: string,
): Promise<void> {
  await redis.client!.hset(siteInfoKey, propKey, propVal);
};

const getValue = async function (propKey: string): Promise<string | null> {
  return await redis.client!.hget(siteInfoKey, propKey);
};
