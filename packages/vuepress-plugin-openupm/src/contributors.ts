import { GithubUserWithScore, PackageMetadataLocal } from '@openupm/types';

export type ContributorProfile = {
  githubUser: string;
  ownedCount: number;
  discoveredCount: number;
  totalSubmittedCount: number;
};

const normalizeGithubUser = (githubUser: string): string =>
  githubUser.trim().toLowerCase();

const matchesGithubUser = (
  actual: string | null | undefined,
  expected: string,
): boolean =>
  actual ? normalizeGithubUser(actual) === expected : false;

const ownsPackage = (
  metadata: PackageMetadataLocal,
  normalizedGithubUser: string,
): boolean =>
  matchesGithubUser(metadata.owner, normalizedGithubUser) ||
  matchesGithubUser(metadata.parentOwner, normalizedGithubUser);

const discoveredPackage = (
  metadata: PackageMetadataLocal,
  normalizedGithubUser: string,
): boolean => matchesGithubUser(metadata.hunter, normalizedGithubUser);

export const collectContributorProfileGithubUsers = function (
  hunters: GithubUserWithScore[],
  owners: GithubUserWithScore[],
): string[] {
  const profiles = new Map<string, string>();
  for (const contributor of [...hunters, ...owners]) {
    const githubUser = contributor.githubUser.trim();
    if (!githubUser) continue;
    const key = normalizeGithubUser(githubUser);
    if (!profiles.has(key)) profiles.set(key, githubUser);
  }
  return [...profiles.values()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
};

export const buildContributorProfile = function (
  githubUser: string,
  metadataLocalList: PackageMetadataLocal[],
): ContributorProfile {
  const normalizedGithubUser = normalizeGithubUser(githubUser);
  const ownedCount = metadataLocalList.filter((metadata) =>
    ownsPackage(metadata, normalizedGithubUser),
  ).length;
  const discoveredCount = metadataLocalList.filter((metadata) =>
    discoveredPackage(metadata, normalizedGithubUser),
  ).length;
  return {
    githubUser,
    ownedCount,
    discoveredCount,
    totalSubmittedCount: ownedCount + discoveredCount,
  };
};
