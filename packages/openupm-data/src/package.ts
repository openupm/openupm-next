// Utilities for handling package metadata.
import spdx from 'spdx-license-list';

import { PackageMetadataLocal } from 'openupm-types';

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
  const metadataLocal: PackageMetadataLocal = {
    ...raw,
  } as PackageMetadataLocal;
  const repoUrl = convertRepoUrl(metadataLocal.repoUrl as string, 'https');
  const repoUrlObj = new URL(repoUrl);
  // Set owner and ownerUrl
  metadataLocal.owner = repoUrlObj.pathname.split('/')[1];
  metadataLocal.ownerUrl = `https://${repoUrlObj.hostname}/${metadataLocal.owner}`;
  // Set repo
  metadataLocal.repo = repoUrlObj.pathname.split('/')[2];
  // Set hunterUrl
  if (metadataLocal.hunter)
    metadataLocal.hunterUrl = `https://${repoUrlObj.hostname}/${metadataLocal.hunter}`;
  else {
    metadataLocal.hunter = '';
    metadataLocal.hunterUrl = null;
  }
  // Set licenseName
  if (metadataLocal.licenseSpdxId && spdx[metadataLocal.licenseSpdxId])
    metadataLocal.licenseName = spdx[metadataLocal.licenseSpdxId].name;
  else {
    metadataLocal.licenseName = '';
    metadataLocal.licenseSpdxId = null;
  }
  // Set parentRepoUrl, parentOwner, parentOwnerUrl and parentRepo
  if (metadataLocal.parentRepoUrl) {
    const parentRepoUrl = convertRepoUrl(metadataLocal.parentRepoUrl, 'https');
    metadataLocal.parentRepoUrl = parentRepoUrl;
    const parentRepoUrlObj = new URL(parentRepoUrl);
    metadataLocal.parentOwner = parentRepoUrlObj.pathname.split('/')[1];
    metadataLocal.parentOwnerUrl = `https://${parentRepoUrlObj.hostname}/${metadataLocal.parentOwner}`;
    metadataLocal.parentRepo = parentRepoUrlObj.pathname.split('/')[2];
  } else {
    metadataLocal.parentOwner = null;
    metadataLocal.parentOwnerUrl = null;
    metadataLocal.parentRepo = null;
    metadataLocal.parentRepoUrl = null;
  }
  // Set readme
  let readme = (metadataLocal.readme || '').trim();
  if (!readme) readme = 'main:README.md';
  else if (readme.indexOf(':') == -1) readme = 'main:' + readme;
  metadataLocal.readme = readme;
  // Set readmeBranch
  metadataLocal.readmeBranch = readme.split(':')[0];
  return metadataLocal;
};
