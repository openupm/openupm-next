/* eslint-disable jest/no-standalone-expect */
import { it } from '@fast-check/jest';
import spdx from 'spdx-license-list';
import { githubRepoUrl, packageMetadataLocalBaseArb } from '@openupm/test';

import {
  convertRepoUrl,
  parsePackageMetadata,
} from '../../src/utils/parse-pkg.js';

describe('convertRepoUrl()', function () {
  it.prop([githubRepoUrl])('should return the https protocol', (repoUrl) => {
    const convertedUrl = convertRepoUrl(repoUrl);
    const repoUrlWithoutGit = repoUrl.replace('.git', '');
    const owner = repoUrlWithoutGit.split('/')[3];
    const repoName = repoUrlWithoutGit.split('/')[4];
    expect(convertedUrl).toEqual(`https://github.com/${owner}/${repoName}`);
  });
});

describe('parsePackageMetadata()', () => {
  it.prop([packageMetadataLocalBaseArb])(
    'should parse package metadata',
    (base) => {
      const owner = base.repoUrl.split('/')[3];
      const ownerUrl = `https://github.com/${owner}`;
      const repo = base.repoUrl.split('/')[4].replace('.git', '');
      const result = parsePackageMetadata(base);
      let hunterUrl: string | null = null;
      if (base.hunter) hunterUrl = `https://github.com/${base.hunter}`;
      let parentRepo: string | null = null;
      let parentOwner: string | null = null;
      let parentOwnerUrl: string | null = null;
      if (base.parentRepoUrl) {
        parentRepo = base.parentRepoUrl.split('/')[4].replace('.git', '');
        parentOwner = base.parentRepoUrl.split('/')[3];
        parentOwnerUrl = `https://github.com/${parentOwner}`;
      }
      expect(result.owner).toEqual(owner);
      expect(result.ownerUrl).toEqual(ownerUrl);
      expect(result.repo).toEqual(repo);
      expect(result.hunterUrl).toEqual(hunterUrl);
      if (base.licenseSpdxId)
        expect(result.licenseName).toEqual(spdx[base.licenseSpdxId].name);
      if (base.parentRepoUrl) {
        expect(result.parentRepo).toEqual(parentRepo);
        expect(result.parentOwner).toEqual(parentOwner);
        expect(result.parentOwnerUrl).toEqual(parentOwnerUrl);
      }
    },
  );
});
