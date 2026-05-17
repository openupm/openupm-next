import { PackageMetadataLocal } from '@openupm/types';

import {
  buildContributorProfile,
  collectContributorProfileGithubUsers,
} from '../src/contributors.js';

describe('contributor profile generation', () => {
  it('includes hunters, owners, and GitHub parent owners without duplicates', () => {
    const githubUsers = collectContributorProfileGithubUsers(
      [
        { githubUser: 'Alice', score: 2 },
        { githubUser: 'bob', score: 1 },
      ],
      [
        { githubUser: 'alice', score: 1 },
        { githubUser: 'ParentOrg', score: 1 },
      ],
    );

    expect(githubUsers).toEqual(['Alice', 'bob', 'ParentOrg']);
  });

  it('counts owned packages from owners and parent owners and discovered packages from hunters', () => {
    const metadata = [
      {
        name: 'com.example.owner',
        owner: 'Alice',
        ownerUrl: 'https://github.com/Alice',
        parentOwner: null,
        parentOwnerUrl: null,
        hunter: 'carol',
        hunterUrl: 'https://github.com/carol',
      },
      {
        name: 'com.example.parent',
        owner: 'fork-owner',
        ownerUrl: 'https://github.com/fork-owner',
        parentOwner: 'alice',
        parentOwnerUrl: 'https://github.com/alice',
        hunter: 'dave',
        hunterUrl: 'https://github.com/dave',
      },
      {
        name: 'com.example.discovered',
        owner: 'bob',
        ownerUrl: 'https://github.com/bob',
        parentOwner: null,
        parentOwnerUrl: null,
        hunter: 'ALICE',
        hunterUrl: 'https://github.com/ALICE',
      },
    ] as PackageMetadataLocal[];

    expect(buildContributorProfile('Alice', metadata)).toEqual({
      githubUser: 'Alice',
      ownedCount: 2,
      discoveredCount: 1,
      totalSubmittedCount: 3,
      profileUrl: 'https://github.com/Alice',
      profileHost: 'github.com',
    });
  });

  it('uses the contributor upstream profile URL and host from matching metadata', () => {
    const metadata = [
      {
        name: 'com.example.gitlab',
        owner: 'Alice',
        ownerUrl: 'https://gitlab.com/Alice',
        parentOwner: null,
        parentOwnerUrl: null,
        hunter: 'bob',
        hunterUrl: 'https://github.com/bob',
      },
    ] as PackageMetadataLocal[];

    expect(buildContributorProfile('Alice', metadata)).toMatchObject({
      profileUrl: 'https://gitlab.com/Alice',
      profileHost: 'gitlab.com',
    });
  });
});
