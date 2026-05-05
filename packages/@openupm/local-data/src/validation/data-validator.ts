import { promises as afs } from 'fs';
import path from 'path';

import yaml from 'js-yaml';
import spdx from 'spdx-license-list';
import {
  isPackageBlockedByScope,
  isValidPackageName,
} from '@openupm/common/build/utils.js';

import { parsePackageMetadata } from '../utils/parse-pkg.js';

export type DataValidationIssue = {
  code: string;
  message: string;
  path?: string;
  packageName?: string;
};

export type DataValidationResult = {
  valid: boolean;
  issues: DataValidationIssue[];
};

export type ValidateDataDirectoryOptions = {
  topLevelYamlFiles?: string[];
};

const defaultTopLevelYamlFiles = [
  'backers.yml',
  'blocked-scopes.yml',
  'builtin.yml',
  'sponsors.yml',
  'topics.yml',
];

function addIssue(
  issues: DataValidationIssue[],
  issue: DataValidationIssue,
): void {
  issues.push(issue);
}

async function loadYamlFile(absPath: string): Promise<unknown> {
  return yaml.load(await afs.readFile(absPath, 'utf8'));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function normalizePackageForLegacyData(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;
    if (!record.hunter) record.hunter = '-';
  }
  return raw;
}

/**
 * Validate an OpenUPM data directory.
 *
 * This intentionally mirrors the package-data checks owned by openupm/openupm,
 * while using the openupm-next package schema as the canonical per-file parser.
 */
export async function validateDataDirectory(
  dataDir: string,
  options?: ValidateDataDirectoryOptions,
): Promise<DataValidationResult> {
  const issues: DataValidationIssue[] = [];
  const absDataDir = path.resolve(dataDir);
  const packagesDir = path.resolve(absDataDir, 'packages');
  const topLevelYamlFiles =
    options?.topLevelYamlFiles || defaultTopLevelYamlFiles;

  let validTopics: { slug: string }[] = [];
  let blockedScopes: string[] = [];

  try {
    const topics = (await loadYamlFile(path.resolve(absDataDir, 'topics.yml'))) as
      | { topics?: { slug: string }[] }
      | undefined;
    validTopics = topics?.topics || [];
  } catch (error) {
    addIssue(issues, {
      code: 'topics-yaml-invalid',
      message: `topics.yml should be valid YAML: ${messageFromError(error)}`,
      path: 'topics.yml',
    });
  }

  try {
    const blocked = (await loadYamlFile(
      path.resolve(absDataDir, 'blocked-scopes.yml'),
    )) as { scopes?: string[] } | undefined;
    blockedScopes = blocked?.scopes || [];
  } catch (error) {
    addIssue(issues, {
      code: 'blocked-scopes-yaml-invalid',
      message: `blocked-scopes.yml should be valid YAML: ${messageFromError(error)}`,
      path: 'blocked-scopes.yml',
    });
  }

  let packageFiles: string[] = [];
  try {
    packageFiles = await afs.readdir(packagesDir);
  } catch (error) {
    addIssue(issues, {
      code: 'packages-dir-invalid',
      message: `packages directory should be readable: ${messageFromError(error)}`,
      path: 'packages',
    });
  }

  for (const file of packageFiles) {
    const relPath = path.join('packages', file);
    if (!file.endsWith('.yml')) {
      addIssue(issues, {
        code: 'package-file-extension-invalid',
        message: `${relPath} should use the .yml extension`,
        path: relPath,
      });
      continue;
    }

    const packageName = file.replace(/\.yml$/, '');
    const absPath = path.resolve(packagesDir, file);
    let raw: unknown;
    try {
      raw = await loadYamlFile(absPath);
    } catch (error) {
      addIssue(issues, {
        code: 'package-yaml-invalid',
        message: `${relPath} should be valid YAML: ${messageFromError(error)}`,
        path: relPath,
        packageName,
      });
      continue;
    }

    try {
      const pkg = parsePackageMetadata(normalizePackageForLegacyData(raw));
      if (!isNonEmptyString(pkg.repoUrl)) {
        addIssue(issues, {
          code: 'package-repo-url-empty',
          message: 'repoUrl is required and must not be empty',
          path: relPath,
          packageName,
        });
      }
      if (!isNonEmptyString(pkg.name)) {
        addIssue(issues, {
          code: 'package-name-empty',
          message: 'name is required and must not be empty',
          path: relPath,
          packageName,
        });
      }
      if (!isNonEmptyString(pkg.licenseName)) {
        addIssue(issues, {
          code: 'package-license-name-empty',
          message: 'licenseName is required and must not be empty',
          path: relPath,
          packageName,
        });
      }
      if (pkg.licenseSpdxId === '') {
        addIssue(issues, {
          code: 'package-license-spdx-id-empty',
          message: 'licenseSpdxId must not be an empty string',
          path: relPath,
          packageName,
        });
      }
      if (!isNonEmptyString(pkg.hunter)) {
        addIssue(issues, {
          code: 'package-hunter-empty',
          message: 'hunter is required and must not be empty',
          path: relPath,
          packageName,
        });
      }

      const [nameValid, nameValidError] = isValidPackageName(pkg.name);
      if (!nameValid) {
        addIssue(issues, {
          code: 'package-name-invalid',
          message:
            nameValidError?.message || 'package name should be valid OpenUPM name',
          path: relPath,
          packageName,
        });
      }
      if (pkg.name !== packageName) {
        addIssue(issues, {
          code: 'package-name-filename-mismatch',
          message: 'pkg.name should match filename without .yml',
          path: relPath,
          packageName,
        });
      }
      for (const scope of blockedScopes) {
        if (isPackageBlockedByScope(pkg.name, scope)) {
          addIssue(issues, {
            code: 'package-scope-blocked',
            message: `${pkg.name} is blocked by scope ${scope}`,
            path: relPath,
            packageName,
          });
        }
      }
      for (const topic of pkg.topics) {
        const found = validTopics.find((x) => x.slug === topic);
        if (!found) {
          addIssue(issues, {
            code: 'package-topic-invalid',
            message: `topic ${topic} should be valid`,
            path: relPath,
            packageName,
          });
        }
      }
      if (pkg.licenseSpdxId && !spdx[pkg.licenseSpdxId]) {
        addIssue(issues, {
          code: 'package-license-spdx-id-invalid',
          message: `licenseSpdxId ${pkg.licenseSpdxId} should be valid`,
          path: relPath,
          packageName,
        });
      }
      if (pkg.image && !/https?:\/\//i.test(pkg.image)) {
        addIssue(issues, {
          code: 'package-image-url-invalid',
          message: 'image field should be a valid URL',
          path: relPath,
          packageName,
        });
      }
    } catch (error) {
      addIssue(issues, {
        code: 'package-metadata-invalid',
        message: `${relPath} metadata should be valid: ${messageFromError(error)}`,
        path: relPath,
        packageName,
      });
    }
  }

  for (const file of topLevelYamlFiles) {
    try {
      const result = await loadYamlFile(path.resolve(absDataDir, file));
      if (result === undefined) {
        addIssue(issues, {
          code: 'top-level-yaml-empty',
          message: `${file} should not parse to undefined`,
          path: file,
        });
      }
    } catch (error) {
      addIssue(issues, {
        code: 'top-level-yaml-invalid',
        message: `${file} should be valid YAML: ${messageFromError(error)}`,
        path: file,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function formatDataValidationIssue(issue: DataValidationIssue): string {
  const location = issue.path ? `${issue.path}: ` : '';
  return `${location}${issue.message} [${issue.code}]`;
}

export async function validateDataDirectoryOrThrow(
  dataDir: string,
  options?: ValidateDataDirectoryOptions,
): Promise<void> {
  const result = await validateDataDirectory(dataDir, options);
  if (!result.valid) {
    throw new Error(result.issues.map(formatDataValidationIssue).join('\n'));
  }
}
