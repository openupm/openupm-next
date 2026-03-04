import fc from 'fast-check';
import spdx from 'spdx-license-list';
import { githubRepoUrl, packageMetadataLocalBaseArb } from '@openupm/test';

import {
  convertRepoUrl,
  parsePackageMetadata,
} from '../../src/utils/parse-pkg.js';

describe('convertRepoUrl()', function () {
  it('should return the https protocol', () => {
    fc.assert(
      fc.property(githubRepoUrl, (repoUrl) => {
        const convertedUrl = convertRepoUrl(repoUrl);
        const repoUrlWithoutGit = repoUrl.replace('.git', '');
        const owner = repoUrlWithoutGit.split('/')[3];
        const repoName = repoUrlWithoutGit.split('/')[4];
        expect(convertedUrl).toEqual(`https://github.com/${owner}/${repoName}`);
      }),
    );
  });
});

describe('parsePackageMetadata()', () => {
  it('should parse package metadata', () => {
    fc.assert(
      fc.property(packageMetadataLocalBaseArb, (base) => {
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
        let image: string | null = null;
        if (base.image) image = base.image;
        const licenseName =
          base.licenseSpdxId && spdx[base.licenseSpdxId]
            ? spdx[base.licenseSpdxId].name
            : base.licenseName;
        expect(result.owner).toEqual(owner);
        expect(result.ownerUrl).toEqual(ownerUrl);
        expect(result.repo).toEqual(repo);
        expect(result.hunterUrl).toEqual(hunterUrl);
        expect(result.licenseName).toEqual(licenseName);
        expect(result.parentRepo).toEqual(parentRepo);
        expect(result.parentOwner).toEqual(parentOwner);
        expect(result.parentOwnerUrl).toEqual(parentOwnerUrl);
        expect(result.image).toEqual(image);
        expect(result.imageFit).toMatch(/^(cover|contain)$/);
      }),
    );
  });
});
