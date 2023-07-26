import { ReleaseReason, ReleaseState } from "./constant";

// PackageMetadataLocalBase represents the base package metadata loaded from the yaml file.
export interface PackageMetadataLocalBase {
  name: string;
  repoUrl: string;
  parentRepoUrl: string | null;
  displayName: string;
  description: string;
  readme: string;
  licenseSpdxId: string | null;
  licenseName: string;
  image: string | null;
  topics: string[];
  // Pipeline fields
  gitTagPrefix: string;
  gitTagIgnore: string;
  minVersion: string;
  // Locale CN fields
  displayName_zhCN: string;
  description_zhCN: string;
  readme_zhCN: string;
  // Misc
  hunter: string;
  createdAt: number;
  excludedFromList?: boolean;
}

// PackageMetadataLocal extends PackageMetadataLocalBase by adding convenience fields.
export interface PackageMetadataLocal extends PackageMetadataLocalBase {
  // GitHub repo name of $owner/$repo
  repo: string;
  // GitHub owner name of $owner/$repo
  owner: string;
  // Github owner url
  ownerUrl: string;
  // Github hunter url
  hunterUrl: string | null;
  // GitHub parent repo name of $parentowner/$repo
  parentRepo: string | null;
  // GitHub parent owner name of $parentowner/$repo
  parentOwner: string | null;
  // Github parent owner url
  parentOwnerUrl: string | null;
  // TODO: for what?
  readmeBranch: string;
  readmeBase: string;
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
export interface PackageMetadata extends PackageMetadataLocal, PackageMetadataRemote { };

export interface PackageRelease {
  version: string;
  commit: string;
  tag: string;
  buildId: string;
  state: ReleaseState;
  reason: ReleaseReason;
  updatedAt: number;
}

export interface PackageInfo {
  releases: PackageRelease[];
  invalidTags: string[];
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
  "dist-tags": { [key: string]: string };
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
  stars: number
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
}

export interface Topic extends TopicBase {
  urlPath: string;
}

export interface License {
  id: string;
  name: string;
}