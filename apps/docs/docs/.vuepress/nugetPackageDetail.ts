import { map } from "lodash-es";

import {
  PackageDependency,
  PackageMetadata,
  PackageVersionViewEntry,
  Packument,
  PackumentVersion,
} from "@openupm/types";
import { timeAgoFormat } from "@/utils";

export type NuGetPackageFrontmatter = {
  name: string;
  nugetId: string;
  unityNuGetVersion: string;
};

export type NuGetPackumentVersion = Partial<PackumentVersion> & {
  author?: string;
  repository?: { url?: string };
};

export const getLatestNuGetVersion = (
  packument: Partial<Packument>,
  fallbackVersion = "",
): string => {
  return packument["dist-tags"]?.latest || fallbackVersion;
};

export const getNuGetVersionInfo = (
  packument: Partial<Packument>,
  version: string,
): NuGetPackumentVersion => {
  return (version && packument.versions?.[version]) || {};
};

export const getNuGetDependencies = (
  versionInfo: NuGetPackumentVersion,
): PackageDependency[] => {
  return map(versionInfo.dependencies || {}, (version, name) => ({
    name,
    version,
  }));
};

export const getNuGetPackageVersions = (
  packument: Partial<Packument>,
  latestVersion: string,
): PackageVersionViewEntry[] => {
  const versions = packument.versions || {};
  const times = packument.time || {};
  return Object.keys(versions)
    .reverse()
    .map((version) => ({
      latest: version === latestVersion,
      timeSince: timeAgoFormat(times[version]),
      unity: versions[version].unity,
      version,
    }));
};

export const getNuGetRepositoryUrl = (
  versionInfo: NuGetPackumentVersion,
): string => {
  return versionInfo.repository?.url || "";
};

export const getNuGetPackageMetadata = (
  name: string,
  repoUrl: string,
): PackageMetadata => {
  return {
    name,
    aliases: [],
    repoUrl,
    displayName: "",
    description: "",
    licenseSpdxId: null,
    licenseName: "",
    topics: [],
    owner: "",
    ownerUrl: null,
    repo: "",
    parentRepoUrl: null,
    parentRepo: null,
    parentOwner: null,
    parentOwnerUrl: null,
    hunter: "",
    hunterUrl: null,
    createdAt: 0,
    readmeBranch: "",
    trackingMode: "git",
    ver: null,
    time: 0,
    stars: 0,
    pstars: 0,
    unity: "",
    imageFilename: null,
    dl30d: 0,
    repoUnavailable: false,
    repoArchived: false,
  };
};
