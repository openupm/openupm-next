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


export interface GithubUserWithScore {
  githubUser: string;
  score: number;
}

