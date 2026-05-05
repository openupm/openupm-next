import { promises as afs } from 'fs';
import os from 'os';
import path from 'path';

import yaml from 'js-yaml';

import { validateDataDirectory } from '../../src/validation/data-validator.js';

type PackageFixture = {
  name: string;
  repoUrl: string;
  displayName: string;
  description: string;
  licenseSpdxId: string | null;
  licenseName: string;
  topics: string[];
  hunter: string;
  createdAt: number;
  image?: string | null;
};

const topLevelFiles = [
  'backers.yml',
  'blocked-scopes.yml',
  'builtin.yml',
  'sponsors.yml',
  'topics.yml',
];

const validPackage: PackageFixture = {
  name: 'com.example.package',
  repoUrl: 'https://github.com/example/package',
  displayName: 'Example Package',
  description: 'Example package description',
  licenseSpdxId: 'MIT',
  licenseName: 'MIT License',
  topics: ['utilities'],
  hunter: 'hunter',
  createdAt: 1_700_000_000_000,
  image: 'https://example.com/image.png',
};

async function createDataDir(): Promise<string> {
  const dataDir = await afs.mkdtemp(path.join(os.tmpdir(), 'openupm-data-'));
  await afs.mkdir(path.join(dataDir, 'packages'));
  await writeYaml(dataDir, 'topics.yml', {
    topics: [{ slug: 'utilities', name: 'Utilities' }],
  });
  await writeYaml(dataDir, 'blocked-scopes.yml', { scopes: [] });
  await writeYaml(dataDir, 'builtin.yml', { packages: [] });
  await writeYaml(dataDir, 'backers.yml', { backers: [] });
  await writeYaml(dataDir, 'sponsors.yml', { sponsors: [] });
  await writePackage(dataDir, validPackage.name, validPackage);
  return dataDir;
}

async function writeYaml(
  dataDir: string,
  relPath: string,
  value: unknown,
): Promise<void> {
  await afs.writeFile(path.join(dataDir, relPath), yaml.dump(value), 'utf8');
}

async function writePackage(
  dataDir: string,
  fileName: string,
  value: unknown,
): Promise<void> {
  await writeYaml(dataDir, path.join('packages', `${fileName}.yml`), value);
}

async function expectIssue(
  mutate: (dataDir: string) => Promise<void>,
  code: string,
): Promise<void> {
  const dataDir = await createDataDir();
  try {
    await mutate(dataDir);
    const result = await validateDataDirectory(dataDir);
    expect(result.issues.map((x) => x.code)).toContain(code);
  } finally {
    await afs.rm(dataDir, { recursive: true, force: true });
  }
}

describe('validateDataDirectory', () => {
  it('passes valid data', async () => {
    const dataDir = await createDataDir();
    try {
      const result = await validateDataDirectory(dataDir);
      expect(result).toEqual({ valid: true, issues: [] });
    } finally {
      await afs.rm(dataDir, { recursive: true, force: true });
    }
  });

  it('covers required package field checks from openupm data tests', async () => {
    expect.assertions(6);
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          displayName: null,
        }),
      'package-metadata-invalid',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          licenseSpdxId: null,
          licenseName: '',
        }),
      'package-license-name-empty',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          licenseSpdxId: '',
        }),
      'package-license-spdx-id-empty',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          topics: 'utilities',
        }),
      'package-metadata-invalid',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          hunter: ' ',
        }),
      'package-hunter-empty',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          createdAt: 'today',
        }),
      'package-metadata-invalid',
    );
  });

  it('covers package semantic checks from openupm data tests', async () => {
    expect.assertions(6);
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          name: 'Com.Example.Package',
        }),
      'package-name-invalid',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          name: 'com.example.other',
        }),
      'package-name-filename-mismatch',
    );
    await expectIssue(async (dataDir) => {
      await writeYaml(dataDir, 'blocked-scopes.yml', {
        scopes: ['^com.example.'],
      });
    }, 'package-scope-blocked');
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          topics: ['unknown'],
        }),
      'package-topic-invalid',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          licenseSpdxId: 'Not-A-License',
        }),
      'package-license-spdx-id-invalid',
    );
    await expectIssue(
      (dataDir) =>
        writePackage(dataDir, validPackage.name, {
          ...validPackage,
          image: 'not-a-url',
        }),
      'package-image-url-invalid',
    );
  });

  it('covers package extension and top-level YAML checks from openupm data tests', async () => {
    expect.assertions(6);
    await expectIssue(
      async (dataDir) =>
        afs.writeFile(
          path.join(dataDir, 'packages', 'com.example.yaml.yaml'),
          yaml.dump(validPackage),
          'utf8',
        ),
      'package-file-extension-invalid',
    );
    for (const file of topLevelFiles) {
      await expectIssue(
        (dataDir) => afs.writeFile(path.join(dataDir, file), '', 'utf8'),
        'top-level-yaml-empty',
      );
    }
  });
});
