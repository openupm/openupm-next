import {
  getContributorProfilePagePath,
  getAvatarImageUrl,
  getMediaBaseUrl,
  getDownloadsRangeUrl,
  getMonthlyDownloadsRangeUrl,
  getMonthlyDownloadsUrl,
  getPackageImageUrl,
  isPackageDetailPath,
  isPackageListPath,
  parsePackageNameFromPackageDetailPath,
} from '../src/urls.js';

describe('getContributorProfilePagePath', () => {
  it('should build the contributor profile path', () => {
    const result = getContributorProfilePagePath('GitHubUser');

    expect(result).toEqual('/contributors/githubuser/');
  });

  it('should encode contributor names and trim surrounding whitespace', () => {
    const result = getContributorProfilePagePath(' user name ');

    expect(result).toEqual('/contributors/user%20name/');
  });
});

describe('isPackageDetailPath', () => {
  it('should return true for path included lowecase letters', () => {
    const result = isPackageDetailPath('/packages/com.example.package/');
    expect(result).toBe(true);
  });

  it('should return true for path included uppercase letters', () => {
    const result = isPackageDetailPath('/packages/com.example.Package/');
    expect(result).toBe(true);
  });

  it('should return true for path included dash', () => {
    const result = isPackageDetailPath('/packages/com.example.package-/');
    expect(result).toBe(true);
  });

  it('should return true for path included underscore', () => {
    const result = isPackageDetailPath('/packages/com.example.package_/');
    expect(result).toBe(true);
  });

  it('should return true for path included numbers', () => {
    const result = isPackageDetailPath('/packages/com.example.package123/');
    expect(result).toBe(true);
  });

  it('should return false for invalid package detail path', () => {
    const result = isPackageDetailPath('/packages/topics/asset-management/');
    expect(result).toBe(false);
  });

  it('should return false for non-package path', () => {
    const result = isPackageDetailPath('/about/');
    expect(result).toBe(false);
  });
});

describe('isPackageListPath', () => {
  it('should return true for package list path', () => {
    const result = isPackageListPath('/packages/');
    expect(result).toBe(true);
  });

  it('should return true for valid package topic path', () => {
    const result = isPackageListPath('/packages/topics/my-topic/');
    expect(result).toBe(true);
  });

  it('should return false for invalid package topic path', () => {
    const result = isPackageListPath('/packages/topics/my-topic/invalid/');
    expect(result).toBe(false);
  });

  it('should return false for non-package path', () => {
    const result = isPackageListPath('/about/');
    expect(result).toBe(false);
  });
});

describe('parsePackageNameFromPackageDetailPath', () => {
  it('should return the package name from a valid package detail path', () => {
    const path = '/packages/com.example.mypackage/';
    const packageName = parsePackageNameFromPackageDetailPath(path);
    expect(packageName).not.toBeNull();
    expect(packageName).toEqual('com.example.mypackage');
  });

  it('should return null for an invalid package detail path', () => {
    const path = '/invalid/path/';
    const packageName = parsePackageNameFromPackageDetailPath(path);
    expect(packageName).toBeNull();
  });

  it('should return null for a package topic path', () => {
    const path = '/packages/topics/2d/';
    const packageName = parsePackageNameFromPackageDetailPath(path);
    expect(packageName).toBeNull();
  });

  it('should return null for a package list path', () => {
    const path = '/packages/';
    const packageName = parsePackageNameFromPackageDetailPath(path);
    expect(packageName).toBeNull();
  });
});

describe('download count urls', () => {
  it('should build the monthly downloads point url', () => {
    const result = getMonthlyDownloadsUrl('com.example.package');

    expect(result).toEqual(
      'https://package.openupm.com/downloads/point/last-month/com.example.package',
    );
  });

  it('should build the monthly downloads range url', () => {
    const result = getMonthlyDownloadsRangeUrl('com.example.package');

    expect(result).toEqual(
      'https://package.openupm.com/downloads/range/last-month/com.example.package',
    );
  });

  it('should build a downloads range url for an explicit date period', () => {
    const result = getDownloadsRangeUrl(
      'com.example.package',
      '2026-01-01:2026-01-31',
    );

    expect(result).toEqual(
      'https://package.openupm.com/downloads/range/2026-01-01:2026-01-31/com.example.package',
    );
  });
});

describe('media urls', () => {
  it('should use the download domain as the media base url', () => {
    expect(getMediaBaseUrl()).toEqual('https://download.openupm.com/media/');
  });

  it('should build package image urls from the media base url', () => {
    expect(getPackageImageUrl('package-image.png')).toEqual(
      'https://download.openupm.com/media/package-image.png',
    );
  });

  it('should build avatar image urls from the media base url', () => {
    expect(getAvatarImageUrl('GitHubUser', 48)).toEqual(
      'https://download.openupm.com/media/githubuser-48x48.png',
    );
  });
});
