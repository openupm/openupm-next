import { GithubUserWithScore, PackageMetadataLocal } from '@openupm/types';
import { getContributorProfilePagePath } from '@openupm/common/build/urls.js';

export type ContributorProfile = {
  githubUser: string;
  ownedCount: number;
  discoveredCount: number;
  totalSubmittedCount: number;
  profileUrl: string;
  profileHost: string;
};

export type GithubUserLink = {
  githubUser?: string | null;
  url?: string;
};

export const normalizeGithubUser = (githubUser: string): string =>
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

const getUrlHost = function (url: string | null | undefined): string {
  if (!url) return 'github.com';
  try {
    return new URL(url).hostname || 'github.com';
  } catch {
    return 'github.com';
  }
};

const getContributorProfileUrl = function (
  githubUser: string,
  metadataLocalList: PackageMetadataLocal[],
): string {
  const normalizedGithubUser = normalizeGithubUser(githubUser);
  for (const metadata of metadataLocalList) {
    if (matchesGithubUser(metadata.owner, normalizedGithubUser)) {
      return metadata.ownerUrl || `https://github.com/${githubUser}`;
    }
    if (matchesGithubUser(metadata.parentOwner, normalizedGithubUser)) {
      return metadata.parentOwnerUrl || `https://github.com/${githubUser}`;
    }
    if (matchesGithubUser(metadata.hunter, normalizedGithubUser)) {
      return metadata.hunterUrl || `https://github.com/${githubUser}`;
    }
  }
  return `https://github.com/${githubUser}`;
};

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

const hasContributorProfile = function (
  contributorProfileGithubUsers: string[],
  githubUser: string,
): boolean {
  const normalizedGithubUser = normalizeGithubUser(githubUser);
  return contributorProfileGithubUsers.some(
    (profileGithubUser) =>
      normalizeGithubUser(profileGithubUser) === normalizedGithubUser,
  );
};

export const getContributorPageOrGithubUrl = function (
  githubUser: string,
  contributorProfileGithubUsers: string[],
): string {
  const trimmedGithubUser = githubUser.trim();
  if (!trimmedGithubUser) return '';
  if (hasContributorProfile(contributorProfileGithubUsers, trimmedGithubUser)) {
    return getContributorProfilePagePath(trimmedGithubUser);
  }
  return `https://github.com/${trimmedGithubUser}`;
};

export const addContributorProfileUrls = function <T extends GithubUserLink>(
  contributors: T[],
  contributorProfileGithubUsers: string[],
): T[] {
  return contributors.map((contributor) => {
    if (contributor.url) return contributor;
    if (!contributor.githubUser) return contributor;
    const url = getContributorPageOrGithubUrl(
      contributor.githubUser,
      contributorProfileGithubUsers,
    );
    if (!url) return contributor;
    return { ...contributor, url };
  });
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
  const profileUrl = getContributorProfileUrl(githubUser, metadataLocalList);
  return {
    githubUser,
    ownedCount,
    discoveredCount,
    totalSubmittedCount: ownedCount + discoveredCount,
    profileUrl,
    profileHost: getUrlHost(profileUrl),
  };
};
