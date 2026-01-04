import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pick } from 'lodash-es';
import semver from 'semver';

import {
  PackageInfo,
  PackageRelease,
  releaseFields,
  ReleaseModel,
} from '@openupm/types';
import { fetchAll } from '@openupm/server-common/build/models/release.js';

import {
  getAggregatedExtraData,
  getRecentPackages,
  getInvalidTags,
  getReadmeHtml,
  getScopes,
} from '@openupm/server-common/build/models/packageExtra.js';

/**
 * Get package info for given package name.
 */
export default function router(server: FastifyInstance): void {
  /**
   * Get aggregated package extra data.
   */
  server.get(
    '/packages/extra',
    async (_req: FastifyRequest, res: FastifyReply) => {
      const data = await getAggregatedExtraData();
      res.send(data);
    },
  );

  /**
   * Get recent packages.
   */
  server.get(
    '/packages/recent',
    async (_req: FastifyRequest, res: FastifyReply) => {
      const data = await getRecentPackages();
      res.send(data);
    },
  );

  server.get(
    '/packages/:name',
    async (
      req: FastifyRequest<{ Params: { name: string } }>,
      res: FastifyReply,
    ) => {
      const pkgName = req.params.name;
      // Get releases sorted by semver
      const releasesModels: ReleaseModel[] = await fetchAll(pkgName);
      const releases: PackageRelease[] = releasesModels.map(
        (x) => pick(x, releaseFields) as PackageRelease,
      );
      releases.sort((a, b) => semver.rcompare(a['version'], b['version']));
      // Get invalid tags
      const invalidTags: string[] = (await getInvalidTags(pkgName)).map(
        (x) => x.tag,
      );
      // Get readme
      const readmeHtml = await getReadmeHtml(pkgName);
      // Get package scopes
      const scopes = await getScopes(pkgName);
      // Return as JSON
      const data: PackageInfo = {
        invalidTags,
        releases,
        readmeHtml,
        scopes,
      };
      res.send(data);
    },
  );
}
