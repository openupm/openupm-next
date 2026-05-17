import { PackageMetadataLocal } from '@openupm/types';

import {
  addContributorProfileUrls,
  buildContributorBadges,
  buildContributorProfile,
  collectContributorProfileGithubUsers,
  CONTRIBUTOR_BADGE_YEARS,
  getContributorPageOrGithubUrl,
} from '../src/contributors.js';

const leaderboard = (githubUser: string, rank: number) =>
  Array.from({ length: rank }, (_, index) => ({
    githubUser: index === rank - 1 ? githubUser : `user-${index + 1}`,
    score: 200 - index,
  }));

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

    expect(buildContributorProfile('Alice', metadata)).toMatchObject({
      githubUser: 'Alice',
      ownedCount: 2,
      discoveredCount: 1,
      totalSubmittedCount: 3,
      profileUrl: 'https://github.com/Alice',
      profileHost: 'github.com',
    });
    expect(buildContributorProfile('Alice', metadata).badges).toEqual([
      expect.objectContaining({
        id: 'package-hunter-1',
        metric: 1,
      }),
      expect.objectContaining({
        id: 'package-owner-1',
        metric: 2,
      }),
    ]);
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

  it('resolves contributor page URLs only when a profile exists', () => {
    const contributorProfileGithubUsers = ['Alice'];

    expect(
      getContributorPageOrGithubUrl('alice', contributorProfileGithubUsers),
    ).toEqual('/contributors/alice/');
    expect(
      getContributorPageOrGithubUrl('bob', contributorProfileGithubUsers),
    ).toEqual('https://github.com/bob');
  });

  it('adds backer URLs that prefer existing contributor profile pages', () => {
    expect(
      addContributorProfileUrls(
        [
          { text: 'Alice Backer', githubUser: 'alice' },
          { text: 'Bob Backer', githubUser: 'bob' },
          {
            text: 'Custom Backer',
            githubUser: 'carol',
            url: 'https://example.com/carol',
          },
        ],
        ['Alice'],
      ),
    ).toEqual([
      {
        text: 'Alice Backer',
        githubUser: 'alice',
        url: '/contributors/alice/',
      },
      {
        text: 'Bob Backer',
        githubUser: 'bob',
        url: 'https://github.com/bob',
      },
      {
        text: 'Custom Backer',
        githubUser: 'carol',
        url: 'https://example.com/carol',
      },
    ]);
  });

  it.each([1, 5, 25, 50, 100])(
    'selects the highest package hunter count tier at %i discoveries',
    (tier) => {
      expect(
        buildContributorBadges('Alice', [], 0, tier).filter((badge) =>
          badge.id.startsWith('package-hunter-'),
        ),
      ).toEqual([
        expect.objectContaining({
          id: `package-hunter-${tier}`,
          metric: tier,
          tier,
        }),
      ]);
    },
  );

  it.each([1, 5, 25, 50, 100])(
    'selects the highest package owner count tier at %i owned packages',
    (tier) => {
      expect(
        buildContributorBadges('Alice', [], tier, 0).filter((badge) =>
          badge.id.startsWith('package-owner-'),
        ),
      ).toEqual([
        expect.objectContaining({
          id: `package-owner-${tier}`,
          metric: tier,
          tier,
        }),
      ]);
    },
  );

  it('keeps only the highest reached count tier per badge family', () => {
    expect(
      buildContributorBadges('Alice', [], 125, 51)
        .filter((badge) => badge.category === 'count')
        .map((badge) => badge.id),
    ).toEqual(['package-hunter-50', 'package-owner-100']);
  });

  it('adds package hunter and owner year badges from 2021 through 2030', () => {
    const metadata = [
      {
        name: 'com.example.before-range',
        owner: 'Alice',
        hunter: 'Alice',
        createdAt: Date.UTC(2020, 0, 1),
      },
      {
        name: 'com.example.hunter-2021',
        owner: 'bob',
        hunter: 'Alice',
        createdAt: Date.UTC(2021, 6, 1),
      },
      {
        name: 'com.example.owner-2026',
        owner: 'Alice',
        hunter: 'bob',
        createdAt: Date.UTC(2026, 6, 1),
      },
      {
        name: 'com.example.owner-2030',
        owner: 'fork',
        parentOwner: 'Alice',
        hunter: 'bob',
        createdAt: Date.UTC(2030, 6, 1),
      },
      {
        name: 'com.example.after-range',
        owner: 'Alice',
        hunter: 'Alice',
        createdAt: Date.UTC(2031, 0, 1),
      },
    ] as PackageMetadataLocal[];

    const yearBadges = buildContributorBadges('Alice', metadata, 3, 3).filter(
      (badge) => badge.category === 'year',
    );

    expect(CONTRIBUTOR_BADGE_YEARS).toContain(2030);
    expect(yearBadges).toEqual([
      expect.objectContaining({
        id: 'package-hunter-2021',
        year: 2021,
        icon: 'year-search',
        tone: 'hunter',
        accent: '#2f7d78',
      }),
      expect.objectContaining({
        id: 'package-owner-2026',
        year: 2026,
        icon: 'year-box',
        tone: 'owner',
        accent: '#765776',
      }),
      expect.objectContaining({
        id: 'package-owner-2030',
        year: 2030,
        icon: 'year-box',
        tone: 'owner',
        accent: '#5e8152',
      }),
    ]);
    expect(yearBadges.map((badge) => badge.id)).not.toContain(
      'package-hunter-2020',
    );
    expect(yearBadges.map((badge) => badge.id)).not.toContain(
      'package-owner-2031',
    );
  });

  it.each([
    [10, 'top-package-hunter-10'],
    [25, 'top-package-hunter-25'],
    [50, 'top-package-hunter-50'],
    [100, 'top-package-hunter-100'],
  ])('selects the highest top hunter rank tier at rank %i', (rank, id) => {
    expect(
      buildContributorBadges('Alice', [], 0, 0, {
        hunters: leaderboard('Alice', rank),
      }).filter((badge) => badge.id.startsWith('top-package-hunter-')),
    ).toEqual([
      expect.objectContaining({
        id,
        rank,
        icon: 'trophy',
        tone: 'hunter',
      }),
    ]);
  });

  it.each([
    [10, 'top-package-owner-10'],
    [25, 'top-package-owner-25'],
    [50, 'top-package-owner-50'],
    [100, 'top-package-owner-100'],
  ])('selects the highest top owner rank tier at rank %i', (rank, id) => {
    expect(
      buildContributorBadges('Alice', [], 0, 0, {
        owners: leaderboard('Alice', rank),
      }).filter((badge) => badge.id.startsWith('top-package-owner-')),
    ).toEqual([
      expect.objectContaining({
        id,
        rank,
        icon: 'trophy',
        tone: 'owner',
      }),
    ]);
  });

  it('adds early contributor only before the 2021-01-01 cutoff', () => {
    const beforeCutoff = Date.UTC(2020, 11, 31);
    const atCutoff = Date.UTC(2021, 0, 1);
    const metadata = [
      {
        name: 'com.example.early',
        owner: 'Alice',
        hunter: 'bob',
        createdAt: beforeCutoff,
      },
      {
        name: 'com.example.later',
        owner: 'carol',
        hunter: 'dave',
        createdAt: atCutoff,
      },
    ] as PackageMetadataLocal[];

    expect(buildContributorBadges('Alice', metadata, 1, 0)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'early-contributor' }),
      ]),
    );
    expect(buildContributorBadges('carol', metadata, 1, 0)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'early-contributor' }),
      ]),
    );
  });

  it('adds current and former backer badges from backer expiry dates', () => {
    const buildDate = new Date(Date.UTC(2026, 4, 17));
    const backers = [
      { githubUser: 'CurrentNoExpiry' },
      { githubUser: 'CurrentExpiry', expires: '2026-05-17' },
      { githubUser: 'FormerExpiry', expires: '2026-05-16' },
      { githubUser: 'InvalidExpiry', expires: '2026-02-31' },
    ];

    expect(
      buildContributorBadges('CurrentNoExpiry', [], 0, 0, {
        backers,
        buildDate,
      }),
    ).toEqual([
      expect.objectContaining({ id: 'current-backer', icon: 'coin' }),
    ]);
    expect(
      buildContributorBadges('CurrentExpiry', [], 0, 0, {
        backers,
        buildDate,
      }),
    ).toEqual([
      expect.objectContaining({ id: 'current-backer', icon: 'coin' }),
    ]);
    expect(
      buildContributorBadges('FormerExpiry', [], 0, 0, {
        backers,
        buildDate,
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'former-backer',
        icon: 'coin',
        tone: 'muted',
      }),
    ]);
    expect(
      buildContributorBadges('InvalidExpiry', [], 0, 0, {
        backers,
        buildDate,
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'former-backer',
        icon: 'coin',
        tone: 'muted',
      }),
    ]);
  });
});
