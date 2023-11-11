import fc from 'fast-check';
import spdxLicenseList from 'spdx-license-list';
import { PackageMetadataLocalBase } from '@openupm/types';

const isDomainSegment = (val: string): boolean => /^[A-Za-z0-9]+$/.test(val);

const isSlug = (val: string): boolean => /^[A-Za-z][A-Za-z0-9-_]*$/.test(val);

export const domainNameSegment = fc
  .string({
    minLength: 2,
    maxLength: 6,
  })
  .filter(isDomainSegment);

export const domainName = fc
  .array(domainNameSegment, { minLength: 2, maxLength: 4 })
  .map((segments) => segments.join('.'));

export const reverseDomainName = fc
  .array(domainNameSegment, { minLength: 3, maxLength: 4 })
  .map((segments) => segments.join('.'));

export const urlPath = fc
  .array(fc.string({ minLength: 2, maxLength: 6 }).filter(isSlug), {
    minLength: 1,
    maxLength: 4,
  })
  .map((segments) => segments.join('/'));

export const githubUsername = fc
  .string({ minLength: 2, maxLength: 6 })
  .filter(isSlug);

export const githubRepoName = fc
  .string({ minLength: 2, maxLength: 6 })
  .filter(isSlug);

export const githubRepoUrl = fc.oneof(
  fc
    .tuple(githubUsername, githubRepoName)
    .map(([username, repo]) => `https://github.com/${username}/${repo}`),
  fc
    .tuple(githubUsername, githubRepoName)
    .map(([username, repo]) => `git://github.com/${username}/${repo}`),
  fc
    .tuple(githubUsername, githubRepoName)
    .map(([username, repo]) => `git://github.com/${username}/${repo}.git`),
  fc
    .tuple(githubUsername, githubRepoName)
    .map(([username, repo]) => `https://github.com/${username}/${repo}.git`),
);

const httpsUrl = fc
  .tuple(domainName, urlPath)
  .map(([domain, path]) => `https://${domain}${path}`);

const spdxLicenseId = fc.constantFrom(
  ...Object.keys(spdxLicenseList).slice(0, 10),
);

const spdxLicenseName = spdxLicenseId.map((id) => spdxLicenseList[id].name);

const semanticDigit = fc.integer({ min: 0, max: 50 });

const prereleaseTag = fc
  .tuple(fc.constantFrom('alpha', 'beta', 'rc'), semanticDigit)
  .map(([tag, version]) => `-${tag}.${version}`);

export const semanticVersion = fc
  .tuple(semanticDigit, semanticDigit, semanticDigit, fc.option(prereleaseTag))
  .map(([major, minor, patch, prerelease]) => {
    let version = `${major}.${minor}.${patch}`;
    if (prerelease !== null) {
      version += prerelease;
    }
    return version;
  });

export const branch = fc.string({ minLength: 2, maxLength: 6 }).filter(isSlug);

export const readmeFilename = fc.constantFrom(
  'README.md',
  'readme.md',
  'Readme.md',
);

export const readme = fc.oneof(
  fc
    .tuple(branch, readmeFilename)
    .map(([branch, filename]) => `${branch}:${filename}`),
  readmeFilename,
);

export const packageMetadataLocalBaseArb = fc.record<PackageMetadataLocalBase>({
  name: reverseDomainName,
  repoUrl: githubRepoUrl,
  parentRepoUrl: fc.oneof(fc.constant(undefined), fc.option(githubRepoUrl)),
  displayName: fc.string(),
  description: fc.string(),
  readme: fc.oneof(fc.constant(undefined), readme),
  licenseSpdxId: fc.option(spdxLicenseId),
  licenseName: fc.oneof(spdxLicenseName, fc.constant('')),
  image: fc.oneof(fc.constant(undefined), fc.option(httpsUrl)),
  imageFit: fc.oneof(
    fc.constant(undefined),
    fc.constantFrom('cover', 'contain'),
  ),
  topics: fc.array(fc.string()),
  hunter: githubUsername,
  createdAt: fc.integer(),
  gitTagPrefix: fc.oneof(fc.constant(undefined), fc.string()),
  gitTagIgnore: fc.oneof(fc.constant(undefined), fc.string()),
  minVersion: fc.oneof(fc.constant(undefined), semanticVersion),
  displayName_zhCN: fc.oneof(fc.constant(undefined), fc.string()),
  description_zhCN: fc.oneof(fc.constant(undefined), fc.string()),
  readme_zhCN: fc.oneof(fc.constant(undefined), fc.string()),
  excludedFromList: fc.oneof(fc.constant(undefined), fc.boolean()),
});
