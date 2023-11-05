import path from 'path';
import fs from 'fs';
import { promises as afs } from 'fs';
import yaml from 'js-yaml';
import { countBy, flatMap, sortBy, toPairs } from 'lodash-es';

import { parsePackageMetadata } from './package.js';
import {
  PackageMetadataLocal,
  GithubUserWithScore,
  TopicBase,
} from 'openupm-common';

/**
 * Get the local data directory.
 * @returns The local data directory.
 * @throws An error if the local data directory doesn't exist.
 */
export const getLocalDataDir = function (): string {
  let dataDir = '';
  if (process.env.OPENUPM_DATA_PATH)
    dataDir = path.resolve(process.env.OPENUPM_DATA_PATH);
  else dataDir = path.resolve(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) return dataDir;
  else throw new Error(`Local data directory doesn't exist at ${dataDir}`);
};

/**
 * Load all package names from local data.
 * @param options loadPackageNames options
 * @returns package name array
 */
export const loadPackageNames = async function (options?: {
  sortKey?: string;
}): Promise<string[]> {
  const { sortKey } = options || {};
  const packagesDir = path.resolve(getLocalDataDir(), 'packages');
  let files = await afs.readdir(packagesDir);
  // Sort
  if (sortKey == 'mtime' || sortKey == '-mtime') {
    files.sort(function (a, b) {
      return (
        fs.statSync(path.join(packagesDir, a)).mtime.getTime() -
        fs.statSync(path.join(packagesDir, b)).mtime.getTime()
      );
    });
  } else if (sortKey == 'name' || sortKey == '-name') {
    files.sort();
  }
  // Reverse for desc
  if (sortKey && sortKey.startsWith('-')) files.reverse();
  // Find paths with *.ya?ml ext.
  files = files
    .filter((p) => (p.match(/.*\.(ya?ml)$/) || [])[1] !== undefined)
    .map((p) => p.replace(/\.ya?ml$/, ''));
  const PACKAGE_LIMIT = Number(process.env.PACKAGE_LIMIT);
  if (PACKAGE_LIMIT > 0) {
    files = files.slice(0, PACKAGE_LIMIT);
  }
  return files;
};

/**
 * Load package metadata local for given package name.
 * @param name package name
 * @returns package meta object
 */
export const loadPackageMetadataLocal = async function (
  name: string,
): Promise<PackageMetadataLocal | null> {
  try {
    const absPath = path.resolve(getLocalDataDir(), 'packages', name + '.yml');
    return parsePackageMetadata(yaml.load(await afs.readFile(absPath, 'utf8')));
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Verify if package metadata local file exists.
 * @param name package name
 * @returns true if package metadata local file exists
 */
export const packageMetadataLocalExists = function (name: string): boolean {
  const absPath: string = path.resolve(
    getLocalDataDir(),
    'packages',
    name + '.yml',
  );
  return fs.existsSync(absPath);
};

/**
 * Load built-in package names.
 * @returns built-in package name array
 */
export const loadBuiltinPackageNames = async function (): Promise<string[]> {
  const absPath = path.resolve(getLocalDataDir(), 'builtin.yml');
  const content = yaml.load(await afs.readFile(absPath, 'utf8'));
  return content.packages;
};

/**
 * Load blocked scopes.
 * @returns blocked scopes array
 */
export const loadBlockedScopes = async function (): Promise<string[]> {
  const absPath = path.resolve(getLocalDataDir(), 'blocked-scopes.yml');
  const content = yaml.load(await afs.readFile(absPath, 'utf8'));
  return content.scopes;
};

/**
 * Load topics.
 * @returns TopicBase array
 */
export const loadTopics = async function (): Promise<TopicBase[]> {
  const absPath = path.resolve(getLocalDataDir(), 'topics.yml');
  const content = yaml.load(await afs.readFile(absPath, 'utf8'));
  return content.topics;
};

/**
 * Collect package hunters and owners from given package meta array.
 * @param metadataLocalList package metadata array
 * @returns package hunters and owners
 */
export const collectPackageHuntersAndOwners = async function (
  metadataLocalList: PackageMetadataLocal[],
): Promise<{ hunters: GithubUserWithScore[]; owners: GithubUserWithScore[] }> {
  const getConstributors = (type: string): GithubUserWithScore[] => {
    const entries = flatMap(metadataLocalList, (pkg) => {
      if (type == 'hunter') return [pkg.hunter];
      else if (type == 'owner') {
        const arr = [pkg.owner];
        if (
          pkg.parentOwner &&
          pkg.parentOwnerUrl &&
          pkg.parentOwnerUrl.toLowerCase().includes('github')
        )
          arr.push(pkg.parentOwner);
        return arr;
      } else {
        return [];
      }
    }).filter((x) => x);
    const counted = countBy(entries);
    const pairs = toPairs(counted).map((x) => ({
      githubUser: x[0],
      score: x[1],
    }));
    return sortBy(pairs, 'score').reverse();
  };
  // Package hunters
  const hunters = getConstributors('hunter');
  const owners = getConstributors('owner');
  return { hunters, owners };
};
