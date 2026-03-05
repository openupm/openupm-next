import { orderBy } from 'lodash-es';

import { loadPackageMetadataLocal, loadPackageNames } from '@openupm/local-data';
import {
  getAggregatedExtraData,
  setRecentPackages,
} from '@openupm/server-common/build/models/packageExtra.js';
import { createLogger } from '@openupm/server-common/build/log.js';

const logger = createLogger('@openupm/jobs/updateRecentPackages');

export async function updateRecentPackagesJob(): Promise<void> {
  const packageNames = await loadPackageNames();
  const aggData = (await getAggregatedExtraData()) as Record<string, object>;

  let results: Array<Record<string, unknown>> = [];
  for (const packageName of packageNames) {
    const pkg = await loadPackageMetadataLocal(packageName);
    if (!pkg) {
      logger.error({ pkg: packageName }, "package doesn't exist");
      continue;
    }

    const extra = aggData[pkg.name] || {};
    const result = joinPackageExtra(
      pkg as unknown as Record<string, unknown>,
      extra as Record<string, unknown>,
    );
    if (!result.pending) results.push(result);
  }

  results = orderBy(results, ['updatedAt'], ['desc']);
  results = results.slice(0, 6);
  await setRecentPackages(results as unknown as string[]);
}

export function joinPackageExtra(
  pkg: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...pkg,
    ...(extra || {}),
  };
  result.createdAt = (result.createdAt as number) || 0;
  result.updatedAt = (result.time as number) || 0;
  result.image = undefined;
  result.imageFilename = (result.imageFilename as string) || undefined;
  result.version = (result.ver as string) || undefined;
  result.pending = !result.version;
  result.link = {
    text: (pkg.displayName as string) || (pkg.name as string),
    link: `/packages/${pkg.name as string}/`,
  };
  return result;
}
