import { loadPackageMetadataLocal, loadPackageNames } from '@openupm/local-data';
import { getPackageImageUrl } from '@openupm/common/build/urls.js';
import {
  getCachedImageFilename,
  getUpdatedTime,
  getVersion,
} from '@openupm/server-common/build/models/packageExtra.js';
import { setFeedRecentUpdate } from '@openupm/server-common/build/models/packageFeed.js';
import { createLogger } from '@openupm/server-common/build/log.js';

const logger = createLogger('@openupm/jobs/updateFeeds');

type FeedAuthor = {
  name: string;
  link: string;
};

type FeedObject = {
  packageName: string;
  displayName: string;
  image?: string;
  time: number;
  version: string;
  author: FeedAuthor[];
};

export async function updateFeedsJob(): Promise<void> {
  const packageNames = await loadPackageNames();
  const feedItems: FeedObject[] = [];

  for (const packageName of packageNames) {
    const pkg = await loadPackageMetadataLocal(packageName);
    if (!pkg) {
      logger.error({ packageName }, 'package metadata local does not exist');
      continue;
    }

    const imageFilename = await getCachedImageFilename(packageName);
    const image = imageFilename ? getPackageImageUrl(imageFilename) || undefined : undefined;
    const time = await getUpdatedTime(packageName);
    const version = await getVersion(packageName);
    const author: FeedAuthor[] = [
      {
        name: pkg.owner,
        link: pkg.ownerUrl,
      },
    ];

    if (pkg.parentRepoUrl && pkg.parentOwner && pkg.parentOwnerUrl) {
      author.push({
        name: pkg.parentOwner,
        link: pkg.parentOwnerUrl,
      });
    }

    if (time && version) {
      feedItems.push({
        packageName,
        displayName: pkg.displayName || packageName,
        image,
        time,
        version,
        author,
      });
    }
  }

  await setFeedRecentUpdate(feedItems);
}
