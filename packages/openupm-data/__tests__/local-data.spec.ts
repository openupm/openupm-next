import {
  collectPackageHuntersAndOwners,
  loadBlockedScopes,
  loadBuiltinPackageNames,
  loadPackageNames,
  loadPackageMetadataLocal,
  packageMetadataLocalExists,
} from '../src/local-data.js';
import { PackageMetadata, PackageMetadataLocal } from 'openupm-types';

describe('loadBlockedScopes()', function () {
  it('should load blocked scopes', async function () {
    const scopes = await loadBlockedScopes();
    expect(scopes).toContain('com.unity.burst');
  });
});

describe('loadBuiltinPackageNames()', function () {
  it('should load builtin package names', async function () {
    const names = await loadBuiltinPackageNames();
    expect(names).toContain('com.unity.burst');
  });
});

describe('loadPackageNames()', function () {
  it('should load package names', async function () {
    const names = await loadPackageNames();
    expect(names).toContain('com.littlebigfun.addressable-importer');
  });
});

describe('loadPackage()', function () {
  it('should load package', async function () {
    const temp = await loadPackageMetadataLocal(
      'com.littlebigfun.addressable-importer',
    );
    const metadataLocal = temp as PackageMetadataLocal;
    expect(metadataLocal).not.toBeNull();
    expect(metadataLocal.name).toEqual('com.littlebigfun.addressable-importer');
    expect(metadataLocal.readme).toEqual('main:README.md');
    expect(metadataLocal.readmeBranch).toEqual('main');
  });
});

describe('packageExists()', function () {
  it('should return true if package exists', async function () {
    const exists = await packageMetadataLocalExists(
      'com.littlebigfun.addressable-importer',
    );
    expect(exists).toEqual(true);
  });
  it("should return false if package doesn't exists", async function () {
    const exists = await packageMetadataLocalExists(
      'com.myorg.package-not-exists',
    );
    expect(exists).toEqual(false);
  });
});

describe('collectPackageHuntersAndOwners', function () {
  it('should return package hunters and owners', async function () {
    const packages = [
      { hunter: 'bob', owner: 'jane' } as PackageMetadataLocal,
      { hunter: 'bob', owner: 'jane' } as PackageMetadataLocal,
      { hunter: 'bob', owner: 'jane' } as PackageMetadataLocal,
      { hunter: 'bob', owner: 'john' } as PackageMetadataLocal,
      {
        hunter: 'peter',
        owner: 'john',
        parentOwner: 'bill',
        parentOwnerUrl: 'https://github.com/bill',
      } as PackageMetadata,
    ];
    const expectedHunters = [
      { githubUser: 'bob', score: 4 },
      { githubUser: 'peter', score: 1 },
    ];
    const expectedOwners = [
      { githubUser: 'jane', score: 3 },
      { githubUser: 'john', score: 2 },
      { githubUser: 'bill', score: 1 },
    ];
    const { hunters, owners } = await collectPackageHuntersAndOwners(packages);
    expect(hunters).toEqual(expectedHunters);
    expect(owners).toEqual(expectedOwners);
  });
});
