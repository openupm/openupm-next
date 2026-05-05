import { describe, expect, it } from 'vitest';

import {
  filterRemoteTags,
  getInvalidTags,
  isRepoUnavailableError,
  toGitRepoUrl,
} from '../../src/workers/buildPackage.js';

describe('buildPackage.filterRemoteTags', () => {
  it('simple', () => {
    const names = filterRemoteTags({
      remoteTags: [
        { tag: '1.0.2', commit: '0000010' },
        { tag: 'patch', commit: '0000009' },
        { tag: '1.0.0', commit: '0000008' },
        { tag: '0.8.0-preview', commit: '0000006' },
        { tag: 'releases/0.8.1-preview', commit: '0000005' },
      ],
    });
    expect(names).toEqual([
      { commit: '0000010', tag: '1.0.2' },
      { commit: '0000008', tag: '1.0.0' },
      { commit: '0000006', tag: '0.8.0-preview' },
      { commit: '0000005', tag: 'releases/0.8.1-preview' },
    ]);
  });

  it('duplication and upm priority', () => {
    const names = filterRemoteTags({
      remoteTags: [
        { tag: '1.0.2-upm', commit: '0000010' },
        { tag: '1.0.2', commit: '0000009' },
        { tag: '1.0.2-master', commit: '0000008' },
      ],
    });
    expect(names).toEqual([{ commit: '0000010', tag: '1.0.2-upm' }]);
  });

  it('prefix, ignore, minVersion', () => {
    const names = filterRemoteTags({
      remoteTags: [
        { tag: 'namespace.module.a/1.0.0', commit: '10' },
        { tag: 'namespace.module.a/2.0.0', commit: '11' },
        { tag: 'namespace.module.b/2.0.0', commit: '12' },
      ],
      gitTagPrefix: 'namespace.module.a',
      gitTagIgnore: '^namespace\\.module\\.a/1\\..*',
      minVersion: '2.0.0',
    });
    expect(names).toEqual([{ tag: 'namespace.module.a/2.0.0', commit: '11' }]);
  });
});

describe('buildPackage.getInvalidTags', () => {
  it('simple', () => {
    const names = getInvalidTags({
      remoteTags: [
        { tag: '1.0.0', commit: '0000001' },
        { tag: '1.0.2', commit: '0000003' },
        { tag: 'releases/2.0.0.1', commit: '0000002' },
        { tag: 'releases/1.0.0', commit: '0000002' },
        { tag: 'releases/1.0.2', commit: '0000004' },
        { tag: 'releases/1.0.3-preview', commit: '0000005' },
      ],
      validTags: [
        { tag: 'releases/1.0.0', commit: '0000002' },
        { tag: 'releases/1.0.2', commit: '0000004' },
      ],
      gitTagPrefix: 'releases',
      gitTagIgnore: '-preview$',
    });
    expect(names).toEqual([{ tag: 'releases/2.0.0.1', commit: '0000002' }]);
  });
});

describe('buildPackage.toGitRepoUrl', () => {
  it('uses anonymous https url for github', () => {
    const url = toGitRepoUrl('https://github.com/openupm/openupm.git');
    expect(url).toEqual('https://github.com/openupm/openupm.git');
  });

  it('uses anonymous https url for github repo path', () => {
    const url = toGitRepoUrl('https://github.com/openupm/openupm');
    expect(url).toEqual('https://github.com/openupm/openupm.git');
  });
});

describe('buildPackage.isRepoUnavailableError', () => {
  it('recognizes GitHub credential prompt as repo unavailable', () => {
    expect(
      isRepoUnavailableError(
        "fatal: could not read Username for 'https://github.com': No such device or address",
      ),
    ).toBe(true);
  });
});
