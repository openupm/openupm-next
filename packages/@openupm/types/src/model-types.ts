export interface ReleaseModel {
  packageName: string;
  version: string;
  commit: string;
  tag: string;
  state: number;
  buildId: string;
  reason: number;
  createdAt: number;
  updatedAt: number;
  source?: 'git' | 'githubRelease';
  signed?: boolean;
  publishedVersion?: string;
  githubReleaseAssetMissingFirstSeenAt?: number;
  githubReleaseAssetMissingLastProbeAt?: number;
  githubReleaseAssetMissingProbeCount?: number;
}

export const releaseModelFields: (keyof ReleaseModel)[] = [
  'packageName',
  'version',
  'commit',
  'tag',
  'state',
  'buildId',
  'reason',
  'createdAt',
  'updatedAt',
  'source',
  'signed',
  'publishedVersion',
  'githubReleaseAssetMissingFirstSeenAt',
  'githubReleaseAssetMissingLastProbeAt',
  'githubReleaseAssetMissingProbeCount',
];

export interface InvalidTag {
  commit: string;
  tag: string;
}
