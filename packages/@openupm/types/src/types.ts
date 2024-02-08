import { ReleaseErrorCode, ReleaseState } from './constant.js';

// The package metadata YAML file format.
export interface PackageMetadataLocalBase {
  name: string;
  repoUrl: string;
  displayName: string;
  description: string;
  licenseSpdxId: string | null;
  licenseName: string;
  topics: string[];
  hunter: string;
  createdAt: number;
  image?: string | null;
  imageFit?: string;
  parentRepoUrl?: string | null;
  readme?: string;
  // Pipeline fields
  gitTagPrefix?: string;
  gitTagIgnore?: string;
  minVersion?: string;
  // Locale CN fields
  displayName_zhCN?: string;
  description_zhCN?: string;
  readme_zhCN?: string;
  // Misc
  excludedFromList?: boolean;
}

// Extended PackageMetadataLocalBase with parsed fields.
export interface PackageMetadataLocal extends PackageMetadataLocalBase {
  // Parsed repository name
  repo: string;
  // Parsed repository owner
  owner: string;
  // Github repository owner URL
  ownerUrl: string;
  // Parsed parent repository name
  parentRepo: string | null;
  // Parsed parent repository owner
  parentOwner: string | null;
  // Github parent repository owner URL
  parentOwnerUrl: string | null;
  // Readme branch name, e.g. "master" or "main"
  readmeBranch: string;
  // Github hunter URL
  hunterUrl: string | null;
}

// PackageMetadataRemote represents the package metadata loaded from the server.
export interface PackageMetadataRemote {
  // Last published version
  ver: string | null;
  // Last published time in milliseconds
  time: number;
  // GitHub repo stars
  stars: number;
  // GitHub parent repo stars
  pstars: number;
  // Supported Unity version
  unity: string;
  // package cover image filename
  imageFilename: string | null;
  // download count in the last 30 days
  dl30d: number;
  // Repo unavailable
  repoUnavailable: boolean;
}

// PackageMetadata merges PackageMetadataLocal and PackageMetadataRemote.
export interface PackageMetadata
  extends PackageMetadataLocal,
    PackageMetadataRemote {}

export interface PackageRelease {
  buildId: string;
  commit: string;
  reason: ReleaseErrorCode;
  state: ReleaseState;
  tag: string;
  updatedAt: number;
  version: string;
}

export const releaseFields: (keyof PackageRelease)[] = [
  'buildId',
  'commit',
  'reason',
  'state',
  'tag',
  'updatedAt',
  'version',
];

export interface PackageInfo {
  invalidTags: string[];
  releases: PackageRelease[];
  readmeHtml: string | null;
  readmeHtml_zhCN: string | null;
  scopes: string[];
}

export interface PackageRegistryVersion {
  name: string;
  displayName: string;
  version: string;
  unity: string;
  description: string;
  dependencies: { [key: string]: string };
  readmeFilename: string;
}

export interface PackageRegistryInfo {
  name: string;
  versions: { [key: string]: PackageRegistryVersion };
  time: { [key: string]: string };
  'dist-tags': { [key: string]: string };
  readme: string;
}

export interface PackageVersionViewEntry {
  version: string;
  unity: string;
  latest: boolean;
  timeSince: string;
}

export interface PackageDependency {
  name: string;
  version: string;
}

export interface SiteInfo {
  // GitHub repo stars
  stars: number;
}

export interface GithubUserWithScore {
  githubUser: string;
  score: number;
}

export interface DailyDownload {
  // date string in format "YYYY-MM-DD"
  day: string;
  // download count
  downloads: number;
}

export interface DownloadsRange {
  package: string;
  start: string;
  end: string;
  downloads: Array<DailyDownload>;
}

export interface TopicBase {
  name: string;
  slug: string;
  keywords: string[];
}

export interface Topic extends TopicBase {
  urlPath: string;
}

export interface License {
  id: string;
  name: string;
}

export interface FormFieldOption {
  key: string;
  text: string;
  selected?: boolean;
}

// AdPlacementData represents the data for an ad placement on web pages.
export interface AdPlacementData {
  title: string;
  image: string;
  price: string;
  url: string;
}

// AdAssetStore represents the data for an asset store advertisement.
export interface AdAssetStore {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  icon: string;
  price: string;
}

export type PageType = 'home' | 'pkgdetail' | 'pkglist' | 'doc' | 'blog';
