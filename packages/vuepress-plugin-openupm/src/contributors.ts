import { GithubUserWithScore, PackageMetadataLocal } from '@openupm/types';
import { getContributorProfilePagePath } from '@openupm/common/build/urls.js';

export type ContributorProfile = {
  githubUser: string;
  ownedCount: number;
  discoveredCount: number;
  totalSubmittedCount: number;
  profileUrl: string;
  profileHost: string;
  badges: ContributorBadge[];
};

export type ContributorBadge = {
  id: string;
  title: string;
  description: string;
  category: 'count' | 'rank' | 'year' | 'history' | 'support';
  tier?: number;
  metric?: number;
  rank?: number;
  year?: number;
  icon: string;
  tone: 'hunter' | 'owner' | 'history' | 'support' | 'muted';
  accent?: string;
};

export type GithubUserLink = {
  githubUser?: string | null;
  url?: string;
};

export type ContributorBacker = GithubUserLink & {
  expires?: unknown;
};

type ContributorProfileBadgeOptions = {
  hunters?: GithubUserWithScore[];
  owners?: GithubUserWithScore[];
  backers?: ContributorBacker[];
  buildDate?: Date;
};

const EARLY_CONTRIBUTOR_CUTOFF = Date.UTC(2021, 0, 1);
const COUNT_TIERS = [1, 5, 25, 50, 100] as const;
const RANK_TIERS = [100, 50, 25, 10] as const;
export const CONTRIBUTOR_BADGE_YEARS = [
  2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
] as const;
const HUNTER_YEAR_ACCENTS: Record<number, string> = {
  2021: '#2f7d78',
  2022: '#257f8c',
  2023: '#2b719d',
  2024: '#38699f',
  2025: '#4d6795',
  2026: '#5b6889',
  2027: '#457a86',
  2028: '#348271',
  2029: '#4b825d',
  2030: '#687b4d',
};
const OWNER_YEAR_ACCENTS: Record<number, string> = {
  2021: '#816a2d',
  2022: '#8a6131',
  2023: '#92583c',
  2024: '#92504d',
  2025: '#884f61',
  2026: '#765776',
  2027: '#7d6657',
  2028: '#89713e',
  2029: '#777b3f',
  2030: '#5e8152',
};

export const normalizeGithubUser = (githubUser: string): string =>
  githubUser.trim().toLowerCase();

const matchesGithubUser = (
  actual: string | null | undefined,
  expected: string,
): boolean => (actual ? normalizeGithubUser(actual) === expected : false);

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

const getHighestReachedTier = function (
  count: number,
  tiers: readonly number[],
): number | undefined {
  return tiers.filter((tier) => count >= tier).at(-1);
};

const getHighestReachedRankTier = function (
  rank: number | undefined,
): number | undefined {
  if (!rank) return undefined;
  return RANK_TIERS.filter((tier) => rank <= tier).at(-1);
};

const getLeaderboardRank = function (
  leaderboard: GithubUserWithScore[] | undefined,
  normalizedGithubUser: string,
): number | undefined {
  if (!leaderboard) return undefined;
  const index = leaderboard.findIndex((contributor) =>
    matchesGithubUser(contributor.githubUser, normalizedGithubUser),
  );
  return index === -1 ? undefined : index + 1;
};

const hasEarlyContribution = function (
  metadataLocalList: PackageMetadataLocal[],
  normalizedGithubUser: string,
): boolean {
  return metadataLocalList.some((metadata) => {
    if (
      !ownsPackage(metadata, normalizedGithubUser) &&
      !discoveredPackage(metadata, normalizedGithubUser)
    ) {
      return false;
    }
    return (
      typeof metadata.createdAt === 'number' &&
      metadata.createdAt < EARLY_CONTRIBUTOR_CUTOFF
    );
  });
};

const getContributionYears = function (
  metadataLocalList: PackageMetadataLocal[],
  normalizedGithubUser: string,
  matchesRole: (
    metadata: PackageMetadataLocal,
    normalizedGithubUser: string,
  ) => boolean,
): number[] {
  const years = new Set<number>();
  for (const metadata of metadataLocalList) {
    if (!matchesRole(metadata, normalizedGithubUser)) continue;
    if (typeof metadata.createdAt !== 'number') continue;
    const year = new Date(metadata.createdAt).getUTCFullYear();
    if ((CONTRIBUTOR_BADGE_YEARS as readonly number[]).includes(year)) {
      years.add(year);
    }
  }
  return [...years].sort((a, b) => a - b);
};

const parseDateOnlyUtc = function (value: unknown): number | undefined {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth() + 1;
    const day = value.getUTCDate();
    return Date.UTC(year, month - 1, day);
  }
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return timestamp;
};

const getBackerState = function (
  backers: ContributorBacker[] | undefined,
  normalizedGithubUser: string,
  buildDate: Date,
): 'current' | 'former' | undefined {
  const backer = backers?.find(
    (candidate) =>
      candidate.githubUser &&
      matchesGithubUser(candidate.githubUser, normalizedGithubUser),
  );
  if (!backer) return undefined;
  if (
    !('expires' in backer) ||
    backer.expires === null ||
    backer.expires === undefined
  ) {
    return 'current';
  }
  const expires = parseDateOnlyUtc(backer.expires);
  if (!expires) return 'former';
  const buildDateOnly = Date.UTC(
    buildDate.getUTCFullYear(),
    buildDate.getUTCMonth(),
    buildDate.getUTCDate(),
  );
  return expires >= buildDateOnly ? 'current' : 'former';
};

export const buildContributorBadges = function (
  githubUser: string,
  metadataLocalList: PackageMetadataLocal[],
  ownedCount: number,
  discoveredCount: number,
  options: ContributorProfileBadgeOptions = {},
): ContributorBadge[] {
  const normalizedGithubUser = normalizeGithubUser(githubUser);
  const badges: ContributorBadge[] = [];
  const hunterTier = getHighestReachedTier(discoveredCount, COUNT_TIERS);
  if (hunterTier) {
    badges.push({
      id: `package-hunter-${hunterTier}`,
      title: 'Package Hunter',
      description: `Discovered at least ${hunterTier} OpenUPM package${
        hunterTier === 1 ? '' : 's'
      }.`,
      category: 'count',
      tier: hunterTier,
      metric: discoveredCount,
      icon: 'search',
      tone: 'hunter',
    });
  }
  const ownerTier = getHighestReachedTier(ownedCount, COUNT_TIERS);
  if (ownerTier) {
    badges.push({
      id: `package-owner-${ownerTier}`,
      title: 'Package Owner',
      description: `Owned at least ${ownerTier} OpenUPM package${
        ownerTier === 1 ? '' : 's'
      }.`,
      category: 'count',
      tier: ownerTier,
      metric: ownedCount,
      icon: 'box',
      tone: 'owner',
    });
  }
  const hunterRank = getLeaderboardRank(options.hunters, normalizedGithubUser);
  const hunterRankTier = getHighestReachedRankTier(hunterRank);
  if (hunterRank && hunterRankTier) {
    badges.push({
      id: `top-package-hunter-${hunterRankTier}`,
      title: 'Top Package Hunter',
      description: `Ranked in the top ${hunterRankTier} package hunters.`,
      category: 'rank',
      tier: hunterRankTier,
      rank: hunterRank,
      icon: 'trophy',
      tone: 'hunter',
    });
  }
  const ownerRank = getLeaderboardRank(options.owners, normalizedGithubUser);
  const ownerRankTier = getHighestReachedRankTier(ownerRank);
  if (ownerRank && ownerRankTier) {
    badges.push({
      id: `top-package-owner-${ownerRankTier}`,
      title: 'Top Package Owner',
      description: `Ranked in the top ${ownerRankTier} package owners.`,
      category: 'rank',
      tier: ownerRankTier,
      rank: ownerRank,
      icon: 'trophy',
      tone: 'owner',
    });
  }
  for (const year of getContributionYears(
    metadataLocalList,
    normalizedGithubUser,
    discoveredPackage,
  )) {
    badges.push({
      id: `package-hunter-${year}`,
      title: 'Package Hunter',
      description: `Discovered an OpenUPM package in ${year}.`,
      category: 'year',
      year,
      icon: 'year-search',
      tone: 'hunter',
      accent: HUNTER_YEAR_ACCENTS[year],
    });
  }
  for (const year of getContributionYears(
    metadataLocalList,
    normalizedGithubUser,
    ownsPackage,
  )) {
    badges.push({
      id: `package-owner-${year}`,
      title: 'Package Owner',
      description: `Owned an OpenUPM package in ${year}.`,
      category: 'year',
      year,
      icon: 'year-box',
      tone: 'owner',
      accent: OWNER_YEAR_ACCENTS[year],
    });
  }
  if (hasEarlyContribution(metadataLocalList, normalizedGithubUser)) {
    badges.push({
      id: 'early-contributor',
      title: 'Early Contributor',
      description:
        'Submitted an owned or discovered package before 2021-01-01.',
      category: 'history',
      icon: 'spark',
      tone: 'history',
    });
  }
  const backerState = getBackerState(
    options.backers,
    normalizedGithubUser,
    options.buildDate || new Date(),
  );
  if (backerState === 'current') {
    badges.push({
      id: 'current-backer',
      title: 'Current Backer',
      description: 'Currently supports OpenUPM as a backer.',
      category: 'support',
      icon: 'coin',
      tone: 'support',
    });
  } else if (backerState === 'former') {
    badges.push({
      id: 'former-backer',
      title: 'Former Backer',
      description: 'Previously supported OpenUPM as a backer.',
      category: 'support',
      icon: 'coin',
      tone: 'muted',
    });
  }
  return badges;
};

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
  options: ContributorProfileBadgeOptions = {},
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
    badges: buildContributorBadges(
      githubUser,
      metadataLocalList,
      ownedCount,
      discoveredCount,
      options,
    ),
  };
};
