import configRaw from 'config';

import { getCachedAvatarImageFilename } from '@openupm/common/build/utils.js';
import {
  getImageQueryForGithubUser,
} from '@openupm/server-common/build/models/packageExtra.js';
import { addImage, getImage } from '@openupm/server-common/build/utils/media.js';
import { createLogger } from '@openupm/server-common/build/log.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/jobs/fetchPackageExtra');

export async function cacheAvatarImageForGithubUser(
  username: string,
  force: boolean,
): Promise<void> {
  const avatarConfig = config.packageExtra?.avatar || {};
  for (const [sizeName, entry] of Object.entries(avatarConfig)) {
    try {
      const avatarEntry = entry as { size: number; duration: number };
      const query = await getImageQueryForGithubUser(username, avatarEntry.size);
      const imageEntry = await getImage(
        query.imageUrl,
        query.width,
        query.height,
        query.fit,
      );
      if (!force && imageEntry && imageEntry.available) {
        logger.info(
          {
            username,
            width: avatarEntry.size,
            height: avatarEntry.size,
            sizeName,
          },
          'cacheAvatarImageForGithubUser cache is available',
        );
        return;
      }
      const filename = getCachedAvatarImageFilename(username, avatarEntry.size);
      await addImage(
        query.imageUrl,
        query.width,
        query.height,
        query.fit,
        avatarEntry.duration,
        force,
        filename,
      );
    } catch (err) {
      logger.error({ err, username, sizeName }, 'cacheAvatarImageForGithubUser error');
    }
  }
}
