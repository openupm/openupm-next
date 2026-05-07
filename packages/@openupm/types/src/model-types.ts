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
];

export interface InvalidTag {
  commit: string;
  tag: string;
}
