import { convertRepoUrl, parsePackageMetadata } from '../../src/package.js';

describe('convertRepoUrl()', function () {
  it('should return https when src=https and format=https', function () {
    expect(convertRepoUrl('https://github.com/username/repo', 'https')).toEqual(
      'https://github.com/username/repo',
    );
  });
  it('should return https when src=https and format=default', function () {
    expect(convertRepoUrl('https://github.com/username/repo')).toEqual(
      'https://github.com/username/repo',
    );
  });
  it('should return https when src=git + and format=https', function () {
    expect(convertRepoUrl('git@github.com:username/repo', 'https')).toEqual(
      'https://github.com/username/repo',
    );
  });
  it('should return git when src=git and format=git', function () {
    expect(convertRepoUrl('git@github.com:username/repo.git', 'git')).toEqual(
      'git@github.com:username/repo.git',
    );
  });
  it('should return git when src=https and format=git', function () {
    expect(
      convertRepoUrl('https://github.com/username/repo.git', 'git'),
    ).toEqual('git@github.com:username/repo.git');
  });
});

describe('parsePackageMetadata', () => {
  test('should parse owner from repoUrl', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
    };
    const expected = {
      owner: 'user',
    };
    const result = parsePackageMetadata(doc);
    expect(result.owner).toEqual(expected.owner);
  });
  test('should parse ownerUrl from repoUrl', () => {
    const doc = {
      repoUrl: 'https://github.com/user/repo',
    };
    const expected = {
      ownerUrl: 'https://github.com/user',
    };
    const result = parsePackageMetadata(doc);
    expect(result.ownerUrl).toEqual(expected.ownerUrl);
  });
  test('should parse repo from repoUrl', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
    };
    const expected = {
      repo: 'repo',
    };
    const result = parsePackageMetadata(doc);
    expect(result.repo).toEqual(expected.repo);
  });
  test('should parse hunterUrl from hunter', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
      hunter: 'hunter',
    };
    const expected = {
      hunterUrl: 'https://github.com/hunter',
    };
    const result = parsePackageMetadata(doc);
    expect(result.hunterUrl).toEqual(expected.hunterUrl);
  });
  test('should set hunterUrl to null if hunter is not defined', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
    };
    const expected = {
      hunter: '',
      hunterUrl: null,
    };
    const result = parsePackageMetadata(doc);
    expect(result.hunter).toEqual(expected.hunter);
    expect(result.hunterUrl).toEqual(expected.hunterUrl);
  });
  test('should parse licenseName from licenseSpdxId', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
      licenseSpdxId: 'MIT',
    };
    const expected = {
      licenseName: 'MIT License',
    };
    const result = parsePackageMetadata(doc);
    expect(result.licenseName).toEqual(expected.licenseName);
  });
  test('should set licenseSpdxId to null if not defined', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
    };
    const expected = {
      licenseSpdxId: null,
    };
    const result = parsePackageMetadata(doc);
    expect(result.licenseSpdxId).toEqual(expected.licenseSpdxId);
  });
  test('should set licenseName to empty string if licenseSpdxId is not defined', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
    };
    const expected = {
      licenseName: '',
    };
    const result = parsePackageMetadata(doc);
    expect(result.licenseName).toEqual(expected.licenseName);
  });
  test('should parse parentOwner from parentRepoUrl', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
      parentRepoUrl: 'git://github.com/user/parent-repo.git',
    };
    const expected = {
      parentOwner: 'user',
    };
    const result = parsePackageMetadata(doc);
    expect(result.parentOwner).toEqual(expected.parentOwner);
  });
  test('should parse parentOwnerUrl from parentRepoUrl', () => {
    const doc = {
      repoUrl: 'git://github.com/user/repo.git',
      parentRepoUrl: 'git://github.com/user/parent-repo.git',
    };
    const expected = {
      parentOwnerUrl: 'https://github.com/user',
    };
    const result = parsePackageMetadata(doc);
    expect(result.parentOwnerUrl).toEqual(expected.parentOwnerUrl);
  });
});
