import {
  isPackageBlockedByScope,
  isValidPackageName,
  getCachedAvatarImageFilename,
  getEnv,
  parsePackageMetadataRemote,
  filterMetadatabyTopicSlug,
  getPackageNamespace,
  isPackageRequiresManualVerification,
} from '../src/utils.js';

describe('isValidPackageName()', function () {
  it('should fail with com.company.UPPERCASE', async function () {
    expect(isValidPackageName('com.company.UPPERCASE')[0]).toBe(false);
  });
  it('should be ok with com.company.lowercase', async function () {
    expect(isValidPackageName('com.company.lowercase')[0]).toBe(true);
  });
  it('should be ok with com.company.lowercase.sub', async function () {
    expect(isValidPackageName('com.company.lowercase.sub')[0]).toBe(true);
  });
  it('should fail with com.company', async function () {
    expect(isValidPackageName('com.company')[0]).toBe(false);
  });
  it('should fail with com', async function () {
    expect(isValidPackageName('com')[0]).toBe(false);
  });
  it('should conform max length', async function () {
    const prefix = 'com.company.';
    expect(
      isValidPackageName('com.company.' + 'a'.repeat(214 - prefix.length))[0],
    ).toBe(true);
    expect(
      isValidPackageName(
        'com.company.' + 'a'.repeat(214 - prefix.length + 1),
      )[0],
    ).toBe(false);
  });
  it('should fail with empty name', async function () {
    expect(isValidPackageName('')[0]).toBe(false);
  });
});

describe('isPackageBlockedByScope', function () {
  it('should return true if the package name is blocked by the given block scope', function () {
    const packageName = 'com.myorg.mypackage';
    const scope = '^com.myorg.';
    const result = isPackageBlockedByScope(packageName, scope);
    expect(result).toBe(true);
  });

  it('should return false if the package name is not blocked by the given block scope', function () {
    const packageName = 'com.myorg.mypackage';
    const scope = '^com.anotherorg.';
    const result = isPackageBlockedByScope(packageName, scope);
    expect(result).toBe(false);
  });

  it('should return true if the package name is equal to the given block scope', function () {
    const packageName = 'com.myorg.mypackage';
    const scope = 'com.myorg.mypackage';
    const result = isPackageBlockedByScope(packageName, scope);
    expect(result).toBe(true);
  });

  it('should return false if the package name is not equal to the given block scope', function () {
    const packageName = 'com.myorg.mypackage';
    const scope = 'com.anotherorg.mypackage';
    const result = isPackageBlockedByScope(packageName, scope);
    expect(result).toBe(false);
  });
});

describe('getEnv', function () {
  it('should return the correct value for node', function () {
    process.env.tempvar1 = 'test';
    expect(getEnv('tempvar1')).toEqual('test');
    process.env.tempvar1 = undefined;
  });
});

describe('getCachedAvatarImageFilename', () => {
  it('should return the correct filename for a given username and size', function () {
    const username = 'JohnDoe';
    const size = 100;
    const expectedFilename = 'johndoe-100x100.png';
    const actualFilename = getCachedAvatarImageFilename(username, size);
    expect(actualFilename).toEqual(expectedFilename);
  });
  it('should return the expected filename', () => {
    const username = 'JohnDoe';
    const size = 64;
    const expected = 'johndoe-64x64.png';
    const result = getCachedAvatarImageFilename(username, size);
    expect(result).toEqual(expected);
  });

  it('should convert username to lowercase', () => {
    const username = 'JaneDoe';
    const size = 128;
    const expected = 'janedoe-128x128.png';
    const result = getCachedAvatarImageFilename(username.toUpperCase(), size);
    expect(result).toEqual(expected);
  });
});

describe('parsePackageMetadataRemote', () => {
  it('should set ver to null if not defined', () => {
    const input = {
      stars: 10,
      pstars: 5,
      imageFilename: 'test.png',
      dl30d: 100,
      repoUnavailable: false,
    };
    const expected = null;
    const result = parsePackageMetadataRemote(input);
    expect(result.ver).toEqual(expected);
  });

  it('should set stars to 0 if not defined', () => {
    const input = {
      ver: '1.0.0',
      pstars: 5,
      imageFilename: 'test.png',
      dl30d: 100,
      repoUnavailable: false,
    };
    const expected = 0;
    const result = parsePackageMetadataRemote(input);
    expect(result.stars).toEqual(expected);
  });

  it('should set pstars to 0 if not defined', () => {
    const input = {
      ver: '1.0.0',
      stars: 10,
      imageFilename: 'test.png',
      dl30d: 100,
      repoUnavailable: false,
    };
    const expected = 0;
    const result = parsePackageMetadataRemote(input);
    expect(result.pstars).toEqual(expected);
  });

  it('should set imageFilename to null if not defined', () => {
    const input = {
      ver: '1.0.0',
      stars: 10,
      pstars: 5,
      dl30d: 100,
      repoUnavailable: false,
    };
    const expected = null;
    const result = parsePackageMetadataRemote(input);
    expect(result.imageFilename).toEqual(expected);
  });

  it('should set dl30d to 0 if not defined', () => {
    const input = {
      ver: '1.0.0',
      stars: 10,
      pstars: 5,
      imageFilename: 'test.png',
      repoUnavailable: false,
    };
    const expected = 0;
    const result = parsePackageMetadataRemote(input);
    expect(result.dl30d).toEqual(expected);
  });

  it('should set repoUnavailable to false if not defined', () => {
    const input = {
      ver: '1.0.0',
      stars: 10,
      pstars: 5,
      imageFilename: 'test.png',
      dl30d: 100,
    };
    const expected = false;
    const result = parsePackageMetadataRemote(input);
    expect(result.repoUnavailable).toEqual(expected);
  });
});

describe('filterMetadatabyTopicSlug', () => {
  const metadata = {
    excludedFromList: false,
    topics: ['javascript', 'typescript'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it('should return false if metadata is excluded from list', () => {
    const result = filterMetadatabyTopicSlug(
      { ...metadata, excludedFromList: true },
      'javascript',
    );
    expect(result).toBe(false);
  });

  it('should return true if metadata topics include the topic slug', () => {
    const result = filterMetadatabyTopicSlug(metadata, 'javascript');
    expect(result).toBe(true);
  });

  it('should return false if metadata topics do not include the topic slug', () => {
    const result = filterMetadatabyTopicSlug(metadata, 'react');
    expect(result).toBe(false);
  });

  it('should return false if metadata is excluded from list, even if topic slug is defined', () => {
    const result = filterMetadatabyTopicSlug(
      { ...metadata, excludedFromList: true },
      'javascript',
    );
    expect(result).toBe(false);
  });
});

describe('getPackageNamespace()', function () {
  it('should handle x.y', async function () {
    const namespace = getPackageNamespace('com.littlebigfun');
    expect(namespace).toEqual('com.littlebigfun');
  });
  it('should handle x.y.z', async function () {
    const namespace = getPackageNamespace(
      'com.littlebigfun.addressable-importer',
    );
    expect(namespace).toEqual('com.littlebigfun');
  });
  it('should handle x.y.z.sub', async function () {
    const namespace = getPackageNamespace(
      'com.littlebigfun.addressable-importer.sub',
    );
    expect(namespace).toEqual('com.littlebigfun');
  });
});

describe('isPackageRequiresManualVerification', () => {
  it('should return true for package names containing "com.unity."', () => {
    expect(isPackageRequiresManualVerification('com.unity.package')).toBe(true);
  });

  it('should return false for package names not containing "com.unity."', () => {
    expect(isPackageRequiresManualVerification('com.example.package')).toBe(
      false,
    );
  });

  it('should be case-insensitive', () => {
    expect(isPackageRequiresManualVerification('COM.UNITY.PACKAGE')).toBe(true);
  });
});
