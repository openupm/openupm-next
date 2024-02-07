import config from 'config';
import { FastifyInstance, FastifyRequest } from 'fastify';

import { AdPlacementData, AdAssetStore } from '@openupm/types';
import redis from '@openupm/server-common/build/redis.js';
import {
  getAdAssetStore,
  getPackageToAdAssetStoreIds,
  getTopicToAdAssetStoreIds,
} from '@openupm/ads/build/models/index.js';
import { convertAdAssetStoreToAdPlacementData } from '@openupm/ads/build/utils/convert.js';

export default function router(server: FastifyInstance): void {
  server.get('/ads/custom', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = await redis.client!.hgetall('ad:custom');
    obj.active = Boolean(obj.active && obj.active !== '0');
    return obj;
  });

  server.get(
    '/ads/pkg/:pkgName',
    async (req: FastifyRequest<{ Params: { pkgName: string } }>) => {
      const pkgName = req.params.pkgName;
      // Fetch ad-assetstore for the package
      const ids = await getPackageToAdAssetStoreIds(pkgName);
      const result = (
        await Promise.all(ids.map((item) => getAdAssetStore(item)))
      ).filter((item) => item !== null) as AdAssetStore[];
      // Pick random ads up to the limit
      const randomPickedResult = result
        .sort(() => Math.random() - 0.5)
        .slice(0, config.packageDetailAdsCount);
      // Convert to AdPlacementData
      const data: AdPlacementData[] = randomPickedResult.map(
        convertAdAssetStoreToAdPlacementData,
      );
      return data;
    },
  );
}
