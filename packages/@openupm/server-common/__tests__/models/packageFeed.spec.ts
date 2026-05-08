import redis from '../../src/redis.js';
import {
  getFeedRecentUpdate,
  setFeedRecentUpdate,
} from '../../src/models/packageFeed.js';

describe('packageFeed', () => {
  afterEach(async () => {
    await redis.client!.del('feed:update:rss2');
    await redis.client!.del('feed:update:atom1');
    await redis.client!.del('feed:update:json1');
  });

  afterAll(async () => {
    await redis.close();
  });

  it('limits recent update feeds using config', async () => {
    await setFeedRecentUpdate(
      Array.from({ length: 60 }, (_, index) => ({
        packageName: `com.example.${index}`,
        displayName: `Example ${index}`,
        time: Date.UTC(2026, 0, index + 1),
        version: '1.0.0',
        author: [{ name: 'openupm', link: 'https://github.com/openupm' }],
      })),
    );

    const feed = await getFeedRecentUpdate('json1');
    const data = JSON.parse(feed || '{}') as {
      items?: Array<{ id?: string }>;
    };

    expect(data.items).toHaveLength(2);
  });
});
