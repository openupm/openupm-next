import { getVersionFromTag } from '../src/semver.js';

describe('getVersionFromTag()', function () {
  it.each([
    // bare versions
    ['1.2.3', '1.2.3'],
    ['v1.2.3', '1.2.3'],
    ['V1.2.3', '1.2.3'],
    // pre-release identifiers
    ['1.2.3-alpha', '1.2.3-alpha'],
    ['1.2.3-alpha.1', '1.2.3-alpha.1'],
    ['1.2.3-beta', '1.2.3-beta'],
    ['1.2.3-beta.2', '1.2.3-beta.2'],
    ['1.2.3-rc.1', '1.2.3-rc.1'],
    ['1.2.3-preview', '1.2.3-preview'],
    ['1.2.3-preview.1', '1.2.3-preview.1'],
    // build metadata (stripped)
    ['v2.0.2+002', '2.0.2'],
    ['1.2.3+build.1', '1.2.3'],
    // loose / non-standard versions
    ['0.10.7b', '0.10.7-b'],
    ['1.2.03', '1.2.3'],
    // path-style prefixes (/)
    ['upm/v1.2.3-beta.2', '1.2.3-beta.2'],
    ['upm/1.0.0', '1.0.0'],
    ['com.example.package/1.2.3', '1.2.3'],
    ['releases/1.2.3', '1.2.3'],
    // hyphen-style prefixes (-)
    ['pkg-1.2.3-rc.1', '1.2.3-rc.1'],
    // underscore-style prefixes (_)
    ['pkg_1.2.3-preview.1', '1.2.3-preview.1'],
    // @ prefix (e.g. com.company.package@1.0.0)
    ['com.example.package@1.0.0', '1.0.0'],
    ['com.example.package@1.2.3-beta.1', '1.2.3-beta.1'],
    // upm/master suffix (stripped)
    ['1.2.3-upm', '1.2.3'],
    ['v1.2.3_upm', '1.2.3'],
    ['1.2.3-master', '1.2.3'],
  ])('parses %s as %s', function (tag, version) {
    expect(getVersionFromTag(tag)).toEqual(version);
  });

  it.each([
    '1.0.0.0',      // 4-part version, not valid semver
    'release',      // no version at all
    'main',         // no version at all
    'latest',       // no version at all
    'package/latest', // path with no version
  ])('returns null for %s', function (tag) {
    expect(getVersionFromTag(tag)).toEqual(null);
  });
});
