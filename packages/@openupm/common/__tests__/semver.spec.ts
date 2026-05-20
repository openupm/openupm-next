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
    ['1.2.3-preview.10', '1.2.3-preview.10'],
    ['1.2.3-alpha.1+build.7', '1.2.3-alpha.1'],
    ['1.2.3-rc.01', '1.2.3-rc.1'],
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
    ['com.example.package@1.2.3-alpha.1+build.7', '1.2.3-alpha.1'],
    ['com.example.package@v1.2.3-preview.10', '1.2.3-preview.10'],
    // multiple version-looking tokens keep the historical rightmost behavior
    ['prefix-1.2.3-2.0.0', '2.0.0'],
    // upm/master suffix (stripped)
    ['1.2.3-upm', '1.2.3'],
    ['v1.2.3_upm', '1.2.3'],
    ['1.2.3-master', '1.2.3'],
  ])('parses %s as %s', function (tag, version) {
    expect(getVersionFromTag(tag)).toEqual(version);
  });

  it.each([
    '1.0.0.0', // 4-part version, not valid semver
    'release', // no version at all
    'main', // no version at all
    'latest', // no version at all
    'package/latest', // path with no version
    'com.example.package1.2.3', // version glued directly to prefix text
    'com.example.package:1.2.3', // unsupported separator without explicit prefix stripping
    'com.example.package@1.2.3-alpha..1', // malformed prerelease
    'com.example.package@1.2.3/foo', // unsupported suffix after version
    'com.example.package@1.2.3_preview', // unsupported suffix after version
  ])('returns null for %s', function (tag) {
    expect(getVersionFromTag(tag)).toEqual(null);
  });
});
