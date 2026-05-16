import { getVersionFromTag } from '../src/semver.js';

describe('getVersionFromTag()', function () {
  it.each([
    ['1.2.3', '1.2.3'],
    ['v1.2.3', '1.2.3'],
    ['V1.2.3', '1.2.3'],
    ['1.2.3-alpha', '1.2.3-alpha'],
    ['1.2.3-alpha.1', '1.2.3-alpha.1'],
    ['1.2.3-beta', '1.2.3-beta'],
    ['1.2.3-beta.2', '1.2.3-beta.2'],
    ['1.2.3-rc.1', '1.2.3-rc.1'],
    ['1.2.3-preview', '1.2.3-preview'],
    ['1.2.3-preview.1', '1.2.3-preview.1'],
    ['upm/v1.2.3-beta.2', '1.2.3-beta.2'],
    ['pkg-1.2.3-rc.1', '1.2.3-rc.1'],
    ['pkg_1.2.3-preview.1', '1.2.3-preview.1'],
    ['1.2.3-upm', '1.2.3'],
    ['v1.2.3_upm', '1.2.3'],
    ['0.10.7b', '0.10.7-b'],
    ['1.2.03', '1.2.3'],
    ['v2.0.2+002', '2.0.2'],
  ])('parses %s as %s', function (tag, version) {
    expect(getVersionFromTag(tag)).toEqual(version);
  });

  it.each(['1.0.0.0', 'release', 'package/latest'])(
    'returns null for %s',
    function (tag) {
      expect(getVersionFromTag(tag)).toEqual(null);
    },
  );
});
