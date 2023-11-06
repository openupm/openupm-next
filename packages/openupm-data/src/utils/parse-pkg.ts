// Utilities for handling package metadata.
import spdx from 'spdx-license-list';
import { assertEquals } from 'typia';

import { PackageMetadataLocal, PackageMetadataLocalBase } from 'openupm-types';

/**
 * Get cleaned GitHub repo url.
 * @param url GitHub repo url
 * @param format the format of the returned url, either https or git
 * @returns cleaned GitHub repo url
 */
export const convertRepoUrl = function (url: string, format?: string): string {
  if (!format) format = 'https';
  if (url.startsWith('git@github.com:'))
    url = url.replace('git@github.com:', 'https://github.com/');
  if (url.endsWith('.git')) url = url.slice(0, url.length - 4);
  const parsedUrl = new URL(url);
  const repo = parsedUrl.pathname.split('/').slice(1, 3).join('/');
  if (format == 'git') return `git@${parsedUrl.host}:${repo}.git`;
  else if (format == 'https') return `https://${parsedUrl.host}/${repo}`;
  else throw new Error('format should be either https or git.');
};

/**
 * Parse package metadata from yaml file.
 * @param raw package metadata read from yaml file
 * @returns the parsed PackageMetadataLocal object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parsePackageMetadata = function (raw: any): PackageMetadataLocal {
  const base = assertEquals<PackageMetadataLocalBase>(raw);
  // Clean repoUrl
  base.repoUrl = convertRepoUrl(base.repoUrl as string, 'https');
  // owner
  const repoUrlObj = new URL(base.repoUrl);
  const owner = repoUrlObj.pathname.split('/')[1];
  // ownerUrl
  const ownerUrl = `https://${repoUrlObj.hostname}/${owner}`;
  // repo
  const repo = repoUrlObj.pathname.split('/')[2];
  // Set licenseName if licenseSpdxId is set
  if (base.licenseSpdxId && spdx[base.licenseSpdxId])
    base.licenseName = spdx[base.licenseSpdxId].name;
  // Set hunterUrl
  const hunterUrl = base.hunter
    ? `https://${repoUrlObj.hostname}/${base.hunter}`
    : null;
  // Clean parentRepoUrl and set parentOwner, parentOwnerUrl and parentRepo
  let parentOwner: string | null = null;
  let parentOwnerUrl: string | null = null;
  let parentRepo: string | null = null;
  if (base.parentRepoUrl) {
    base.parentRepoUrl = convertRepoUrl(base.parentRepoUrl, 'https');
    const parentRepoUrlObj = new URL(base.parentRepoUrl);
    parentOwner = parentRepoUrlObj.pathname.split('/')[1];
    parentOwnerUrl = `https://${parentRepoUrlObj.hostname}/${parentOwner}`;
    parentRepo = parentRepoUrlObj.pathname.split('/')[2];
  }
  // Set readme
  let readme = (base.readme || '').trim();
  if (!readme) readme = 'main:README.md';
  else if (readme.indexOf(':') == -1) readme = 'main:' + readme;
  base.readme = readme;
  // Set readmeBranch
  const readmeBranch = readme.split(':')[0];
  return {
    ...base,
    repo,
    owner,
    ownerUrl,
    parentRepo,
    parentOwner,
    parentOwnerUrl,
    readmeBranch,
    hunterUrl,
  };
};
