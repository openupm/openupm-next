import {
  PackageMetadata,
  PackageMetadataLocal,
  PackageMetadataRemote,
} from '@openupm/types';
import { getPackageMetadata } from '@openupm/common/build/utils.js';

export type ContributorProfileStats = {
  ownedCount: number;
  discoveredCount: number;
  totalSubmittedCount: number;
};

const emptyMetadataRemote: PackageMetadataRemote = {
  ver: null,
  time: 0,
  stars: 0,
  pstars: 0,
  unity: '2017.2',
  imageFilename: null,
  dl30d: 0,
  repoUnavailable: false,
  repoArchived: false,
};

export const normalizeGithubUser = function (githubUser: string): string {
  return githubUser.trim().toLowerCase();
};

export const githubUserMatches = function (
  actual: string | null | undefined,
  expected: string,
): boolean {
  return actual
    ? normalizeGithubUser(actual) === normalizeGithubUser(expected)
    : false;
};

export const isOwnedByContributor = function (
  metadata: PackageMetadataLocal,
  githubUser: string,
): boolean {
  return (
    githubUserMatches(metadata.owner, githubUser) ||
    githubUserMatches(metadata.parentOwner, githubUser)
  );
};

export const isDiscoveredByContributor = function (
  metadata: PackageMetadataLocal,
  githubUser: string,
): boolean {
  return githubUserMatches(metadata.hunter, githubUser);
};

export const toPackageMetadata = function (
  metadataLocal: PackageMetadataLocal,
  metadataRemote?: PackageMetadataRemote,
): PackageMetadata {
  return getPackageMetadata(
    metadataLocal,
    metadataRemote || emptyMetadataRemote,
  );
};

export const getContributorOwnedPackages = function (
  metadataLocalList: PackageMetadataLocal[],
  githubUser: string,
): PackageMetadataLocal[] {
  return metadataLocalList.filter((metadata) =>
    isOwnedByContributor(metadata, githubUser),
  );
};

export const getContributorDiscoveredPackages = function (
  metadataLocalList: PackageMetadataLocal[],
  githubUser: string,
): PackageMetadataLocal[] {
  return metadataLocalList.filter((metadata) =>
    isDiscoveredByContributor(metadata, githubUser),
  );
};

export const getContributorProfileStats = function (
  metadataLocalList: PackageMetadataLocal[],
  githubUser: string,
): ContributorProfileStats {
  const ownedCount = getContributorOwnedPackages(
    metadataLocalList,
    githubUser,
  ).length;
  const discoveredCount = getContributorDiscoveredPackages(
    metadataLocalList,
    githubUser,
  ).length;
  return {
    ownedCount,
    discoveredCount,
    totalSubmittedCount: ownedCount + discoveredCount,
  };
};
