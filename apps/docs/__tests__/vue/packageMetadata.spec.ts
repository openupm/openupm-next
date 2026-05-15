import { getPackageAliasNavLinks } from '../../docs/.vuepress/components/package-metadata';
import { describe, expect, it } from 'vitest';

describe('package metadata aliases', () => {
  it('returns no links for packages without aliases', () => {
    expect(getPackageAliasNavLinks({ aliases: [] })).toEqual([]);
  });

  it('returns links to redirected package pages for aliases', () => {
    expect(
      getPackageAliasNavLinks({
        aliases: ['com.example.old', 'com.example.older'],
      }),
    ).toEqual([
      {
        link: '/packages/com.example.old/',
        text: 'com.example.old',
      },
      {
        link: '/packages/com.example.older/',
        text: 'com.example.older',
      },
    ]);
  });
});
