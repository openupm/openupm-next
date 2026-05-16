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
        parentOwner: null,
        hunter: 'carol',
      },
      {
        name: 'com.example.parent',
        owner: 'fork-owner',
        parentOwner: 'alice',
        hunter: 'dave',
      },
      {
        name: 'com.example.discovered',
        owner: 'bob',
        parentOwner: null,
        hunter: 'ALICE',
      },
    ] as PackageMetadataLocal[];

    expect(buildContributorProfile('Alice', metadata)).toEqual({
      githubUser: 'Alice',
      ownedCount: 2,
      discoveredCount: 1,
      totalSubmittedCount: 3,
    });
  });
});
