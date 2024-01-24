import config from 'config';
import { FastifyInstance, FastifyRequest } from 'fastify';

import { AdPlacementData, AdAssetStore } from '@openupm/types';
import redis from '@openupm/server-common/build/redis.js';
import {
  getAdAssetStore,
  getAdPackageToAssetStore,
} from '@openupm/server-common/build/models/ad.js';
import { convertAdAssetStoreToAdPlacementData } from '@openupm/server-common/build/utils/ad.js';

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
      const ids = await getAdPackageToAssetStore(pkgName);
      const result = (
        await Promise.all(ids.map((item) => getAdAssetStore(item)))
      ).filter((item) => item !== null) as AdAssetStore[];
      const randomPickedResult = result
        .sort(() => Math.random() - 0.5)
        .slice(0, config.packageDetailAdsCount);
      const data: AdPlacementData[] = randomPickedResult.map(
        convertAdAssetStoreToAdPlacementData,
      );
      data.forEach((item) => {
        item.price = '$' + item.price;
      });
      return data;
    },
  );
}
