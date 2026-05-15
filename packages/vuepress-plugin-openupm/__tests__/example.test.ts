import {
  buildPackageAliasRedirects,
  mergePackageAliasRedirects,
} from '../src/redirects.js';
import { PackageMetadataLocal } from '@openupm/types';

describe('package alias redirects', () => {
  it('generates Netlify redirects from package aliases', () => {
    const metadata = [
      {
        name: 'com.example.current',
        aliases: ['com.example.old', 'com.example.older'],
      },
      {
        name: 'com.example.no-aliases',
        aliases: [],
      },
    ] as PackageMetadataLocal[];

    expect(buildPackageAliasRedirects(metadata)).toEqual(
      [
        '/packages/com.example.old/ /packages/com.example.current/ 301',
        '/packages/com.example.older/ /packages/com.example.current/ 301',
      ].join('\n'),
    );
  });

  it('preserves existing static redirects when appending alias redirects', () => {
    expect(
      mergePackageAliasRedirects(
        '# static\n/feeds/* https://api.openupm.com/feeds/:splat 200\n',
        '/packages/com.example.old/ /packages/com.example.current/ 301',
      ),
    ).toEqual(
      [
        '# static',
        '/feeds/* https://api.openupm.com/feeds/:splat 200',
        '',
        '# Package rename redirects generated from package aliases.',
        '/packages/com.example.old/ /packages/com.example.current/ 301',
        '',
      ].join('\n'),
    );
  });
});
