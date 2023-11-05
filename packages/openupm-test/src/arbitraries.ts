import fc from 'fast-check';

const isDomainSegment = (val: string): boolean => /^[A-Za-z0-9]+$/.test(val);

const isSlug = (val: string): boolean => /^[A-Za-z0-9-_]+$/.test(val);

export const reverseDomainNameSegment = fc
  .string({
    minLength: 2,
    maxLength: 6,
  })
  .filter(isDomainSegment);

export const reverseDomainName = fc
  .array(reverseDomainNameSegment, { minLength: 3, maxLength: 4 })
  .map((segments) => segments.join('.'));

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
