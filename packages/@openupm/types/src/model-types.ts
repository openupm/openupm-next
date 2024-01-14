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
];

export interface InvalidTag {
  commit: string;
  tag: string;
}
