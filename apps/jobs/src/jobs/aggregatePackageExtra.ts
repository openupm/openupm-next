import { loadPackageMetadataLocal, loadPackageNames } from '@openupm/local-data';
import {
  getCachedImageFilename,
  getMonthlyDownloads,
  getParentStars,
  getRepoPushedTime,
  getRepoUnavailable,
  getStars,
  getUnityVersion,
  getUpdatedTime,
  getVersion,
  setAggregatedExtraData,
} from '@openupm/server-common/build/models/packageExtra.js';
import { createLogger } from '@openupm/server-common/build/log.js';

const logger = createLogger('@openupm/jobs/aggregatePackageExtra');

type AggregatedEntry = {
  stars: number;
  pstars?: number;
  unity: string;
  imageFilename?: string;
  time?: number;
  ver?: string;
  repoUnavailable?: boolean;
  dl30d: number;
};

export async function aggregatePackageExtraJob(): Promise<void> {
  const packageNames = await loadPackageNames();
  const aggregated: Record<string, AggregatedEntry> = {};

  for (const packageName of packageNames) {
    const pkg = await loadPackageMetadataLocal(packageName);
    if (!pkg) {
      logger.error({ packageName }, 'package metadata local does not exist');
      continue;
    }

    const stars = await getStars(packageName);
    const pstars = await getParentStars(packageName);
    const unity = await getUnityVersion(packageName);
    const imageFilename = await getCachedImageFilename(packageName);
    const updatedTime = await getUpdatedTime(packageName);
    const pushedTime = await getRepoPushedTime(packageName);
    const version = await getVersion(packageName);
    const repoUnavailable = await getRepoUnavailable(packageName);
    const dl30d = await getMonthlyDownloads(packageName);

    aggregated[packageName] = {
      stars: stars || 0,
      pstars: pstars || undefined,
      unity: unity || '2018.1',
      imageFilename: imageFilename || undefined,
      time: updatedTime || pushedTime || undefined,
      ver: version || undefined,
      repoUnavailable: repoUnavailable || undefined,
      dl30d,
    };
  }

  await setAggregatedExtraData(aggregated);
}
