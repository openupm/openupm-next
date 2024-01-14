import { orderBy } from 'lodash-es';
import { Feed } from 'feed';

import redis from '../redis.js';

const feedRecentUpdateKey = 'feed:update:';
const recentUpdateCount = 50;

interface Author {
  name: string;
  link: string;
}

interface FeedObject {
  packageName: string;
  displayName: string;
  time: number;
  version: string;
  author: Author[];
  image?: string;
}

/**
 * Set aggregated extra data.
 * @param objs Array of feed objects.
 */
const setFeedRecentUpdate = async (objs: FeedObject[]): Promise<void> => {
  // Sort by time.
  objs = orderBy(objs, ['time'], ['desc']);
  // Generate the feed.
  const feed = new Feed({
    title: 'OpenUPM Recent Updates',
    description: 'Feed of OpenUPM Recently Updated Packages',
    id: 'https://openupm.com/',
    link: 'https://openupm.com/',
    language: 'en',
    image: 'https://openupm.com/images/openupm-icon-256.png',
    copyright: 'Copyright @ 2019 Favo Yang',
    feedLinks: {
      rss: 'https://openupm.com/feeds/updates/rss',
      json: 'https://openupm.com/feeds/updates/json',
      atom: 'https://openupm.com/feeds/updates/atom',
    },
    author: {
      name: 'OpenUPM',
      email: 'hello@openupm.com',
      link: 'https://openupm.com',
    },
  });

  const limit = Math.min(objs.length, recentUpdateCount);
  for (let i = 0; i < limit; i++) {
    const obj = objs[i];
    const guid = `${obj.packageName}@${obj.version}`;
    const url = `https://openupm.com/packages/${obj.packageName}`;
    const title = `${obj.displayName} v${obj.version} release`;
    const description = `Package ${obj.packageName} v${obj.version} is released.`;
    const date = new Date(obj.time);
    feed.addItem({
      title,
      id: guid,
      link: url,
      description,
      content: description,
      date,
      author: obj.author,
      image: obj.image,
    });
  }
  // Save for formats.
  const rss2 = feed.rss2();
  await redis.client!.set(feedRecentUpdateKey + 'rss2', rss2);
  const atom1 = feed.atom1();
  await redis.client!.set(feedRecentUpdateKey + 'atom1', atom1);
  const json1 = feed.json1();
  await redis.client!.set(feedRecentUpdateKey + 'json1', json1);
};

/**
 * Get aggregated extra data.
 * @param format The format of the feed to retrieve.
 */
const getFeedRecentUpdate = async (format: string): Promise<string | null> => {
  const text = await redis.client!.get(feedRecentUpdateKey + format);
  return text;
};

export { getFeedRecentUpdate, setFeedRecentUpdate };
