import { describe, expect, it } from 'vitest';

import { parseRemoteTagsOutput } from '../../src/utils/git.js';

describe('parseRemoteTagsOutput', () => {
  it('test lightweight tags', () => {
    expect(
      parseRemoteTagsOutput(`
7106c180fdf7d52aaae62088cae948d1c3e825cd\trefs/tags/v0.1.1
74ef3d7d5f383401aa8c9ed4859ef37115210f66\trefs/tags/v0.2.1
      `),
    ).toEqual([
      { commit: '7106c180fdf7d52aaae62088cae948d1c3e825cd', tag: 'v0.1.1' },
      { commit: '74ef3d7d5f383401aa8c9ed4859ef37115210f66', tag: 'v0.2.1' },
    ]);
  });

  it('test annotated tags', () => {
    expect(
      parseRemoteTagsOutput(`
7106c180fdf7d52aaae62088cae948d1c3e825cd\trefs/tags/v0.1.1
59f757ab6e5e667d54a3397195b3ec8399ef856b\trefs/tags/v0.1.1^{}
74ef3d7d5f383401aa8c9ed4859ef37115210f66\trefs/tags/v0.2.1
      `),
    ).toEqual([
      { commit: '59f757ab6e5e667d54a3397195b3ec8399ef856b', tag: 'v0.1.1' },
      { commit: '74ef3d7d5f383401aa8c9ed4859ef37115210f66', tag: 'v0.2.1' },
    ]);
  });
});
