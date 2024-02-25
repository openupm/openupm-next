import { getVersionFromTag } from '../src/semver.js';

describe('getVersionFromTag()', function () {
  it('test a.b.c', function () {
    expect(getVersionFromTag('v1.0.0')).toEqual('1.0.0');
  });
  it('test va.b.c', function () {
    expect(getVersionFromTag('v1.0.0')).toEqual('1.0.0');
  });
  it('test Va.b.c', function () {
    expect(getVersionFromTag('V1.0.0')).toEqual('1.0.0');
  });
  it('test a.b.c-preview', function () {
    expect(getVersionFromTag('1.0.0-preview')).toEqual('1.0.0-preview');
  });
  it('test va.b.c-preview', function () {
    expect(getVersionFromTag('v1.0.0-preview')).toEqual('1.0.0-preview');
  });
  it('test a.b.c.d', function () {
    expect(getVersionFromTag('1.0.0.0')).toEqual(null);
  });
  it('test va.b.c.d', function () {
    expect(getVersionFromTag('v1.0.0.0')).toEqual(null);
  });
  it('test a.b.c-preview.d', function () {
    expect(getVersionFromTag('1.0.0-preview.0')).toEqual('1.0.0-preview.0');
  });
  it('test va.b.c-preview.d', function () {
    expect(getVersionFromTag('v1.0.0-preview.0')).toEqual('1.0.0-preview.0');
  });
  it('test releases/va.b.c-preview.d', function () {
    expect(getVersionFromTag('releases/v1.0.0-preview.0')).toEqual(
      '1.0.0-preview.0',
    );
  });
  it('test releases-va.b.c-preview.d', function () {
    expect(getVersionFromTag('releases-v1.0.0-preview.0')).toEqual(
      '1.0.0-preview.0',
    );
  });
  it('test releases_va.b.c-preview.d', function () {
    expect(getVersionFromTag('releases_v1.0.0-preview.0')).toEqual(
      '1.0.0-preview.0',
    );
  });
  it('test va.b.c-upm', function () {
    expect(getVersionFromTag('v1.0.0-upm')).toEqual('1.0.0');
  });
  it('test va.b.c_upm', function () {
    expect(getVersionFromTag('v1.0.0_upm')).toEqual('1.0.0');
  });
});
