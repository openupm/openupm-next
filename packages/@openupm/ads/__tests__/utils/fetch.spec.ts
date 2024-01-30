import { PackageMetadataLocal } from '@openupm/types';
import {
  collectTextFromPackage,
  // fetchPackageToAdAssetStoreIds,
} from '../../src/utils/fetch.js';

describe('collectTextFromPackage', function () {
  it('should include displayName', function () {
    const pkg: Partial<PackageMetadataLocal> = {
      name: 'com.example.foo',
      displayName: 'Foo',
      description: 'Blar blar blar',
    };
    const result = collectTextFromPackage(pkg as PackageMetadataLocal);
    expect(result).toContain('Foo');
  });
  it('should include last section of the package name', function () {
    const pkg: Partial<PackageMetadataLocal> = {
      name: 'com.example.foo-foo1',
      description: 'Blar blar blar',
    };
    const result = collectTextFromPackage(pkg as PackageMetadataLocal);
    expect(result).toContain('foo');
    expect(result).toContain('foo1');
  });
  it('should include description', function () {
    const pkg: Partial<PackageMetadataLocal> = {
      name: 'com.example.foo',
      displayName: 'Foo',
      description: 'Blar blar blar',
    };
    const result = collectTextFromPackage(pkg as PackageMetadataLocal);
    expect(result).toContain('blar');
  });
});

describe('fetchPackageToAdAssetStoreIds', function () {
  // it('should return null for package not existed', async function () {
  //   const result = await fetchPackageToAdAssetStoreIds('com.example.not-existed');
  //   expect(result).toBeNull();
  // });
});
