export interface PackageMetadata {
  name: string;
  repoUrl: string;
  repo: string;
  owner: string;
  ownerUrl: string;
  hunter: string;
  hunterUrl: string | null;
  licenseSpdxId: string | null;
  licenseName: string;
  parentRepoUrl: string | null;
  parentRepo: string | null;
  parentOwner: string | null;
  parentOwnerUrl: string | null;
  readme: string;
  readmeBranch: string;
  readmeBase: string;
}

export interface PackageExtraMetadata {
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
}

export interface PackageInfo extends PackageMetadata, PackageExtraMetadata {};

export interface GithubUserWithScore {
  githubUser: string;
  score: number;
}