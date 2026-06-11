import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PackageMetadataLocal } from "@openupm/types";
import { describe, expect, it } from "vitest";

import {
  formatPackageSubmittedDate,
  getContributorDiscoveredPackages,
  getContributorOwnedPackages,
  getContributorProfileStats,
  toContributorProfilePackageEntry,
  toPackageMetadata,
} from "../../docs/.vuepress/components/contributor-profile";

const layoutPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/layouts/ContributorProfileLayout.vue",
    import.meta.url,
  ),
);
const badgeWallPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/ContributorBadgeWall.vue",
    import.meta.url,
  ),
);
const badgeReviewPagePath = fileURLToPath(
  new URL("../../docs/docs/contributor-badges/index.md", import.meta.url),
);
const contributorsPagePath = fileURLToPath(
  new URL("../../docs/contributors/index.md", import.meta.url),
);
const styleCheatsheetPath = fileURLToPath(
  new URL("../../docs/docs/dev/style-cheatsheet.md", import.meta.url),
);

const packageMetadataViewPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageMetadataView.vue",
    import.meta.url,
  ),
);
const githubAvatarPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/GitHubAvatar.vue", import.meta.url),
);
const pluginPath = fileURLToPath(
  new URL(
    "../../../../packages/vuepress-plugin-openupm/src/index.ts",
    import.meta.url,
  ),
);
const docsConfigPath = fileURLToPath(
  new URL("../../docs/.vuepress/config-us.ts", import.meta.url),
);
const designNotesPath = fileURLToPath(
  new URL("../../../../design.md", import.meta.url),
);

const metadata = [
  {
    name: "com.example.owner",
    owner: "Alice",
    parentOwner: null,
    hunter: "carol",
    displayName: "Owner Package",
    description: "",
    topics: [],
    createdAt: 1700000000000,
  },
  {
    name: "com.example.parent",
    owner: "fork-owner",
    parentOwner: "alice",
    hunter: "dave",
    displayName: "Parent Package",
    description: "",
    topics: [],
    createdAt: 1701000000000,
  },
  {
    name: "com.example.discovered",
    owner: "bob",
    parentOwner: null,
    hunter: "ALICE",
    displayName: "Discovered Package",
    description: "",
    topics: [],
    createdAt: 1702000000000,
  },
  {
    name: "com.example.both",
    owner: "Alice",
    parentOwner: null,
    hunter: "alice",
    displayName: "Both Package",
    description: "",
    topics: [],
    createdAt: 1703000000000,
  },
  {
    name: "com.example.local-only",
    owner: "alice",
    parentOwner: null,
    hunter: "eve",
    displayName: "Local Only Package",
    description: "",
    topics: [],
    createdAt: 1699000000000,
  },
] as PackageMetadataLocal[];

describe("contributor profile filtering", () => {
  it("matches owned packages by owner case-insensitively", () => {
    expect(
      getContributorOwnedPackages(metadata, "alice").map((x) => x.name),
    ).toContain("com.example.owner");
  });

  it("matches owned packages by GitHub parent owner case-insensitively", () => {
    expect(
      getContributorOwnedPackages(metadata, "Alice").map((x) => x.name),
    ).toContain("com.example.parent");
  });

  it("matches discovered packages by hunter case-insensitively", () => {
    expect(
      getContributorDiscoveredPackages(metadata, "alice").map((x) => x.name),
    ).toContain("com.example.discovered");
  });

  it("allows the same user to appear in both sections", () => {
    expect(
      getContributorOwnedPackages(metadata, "alice").map((x) => x.name),
    ).toContain("com.example.both");
    expect(
      getContributorDiscoveredPackages(metadata, "alice").map((x) => x.name),
    ).toContain("com.example.both");
  });

  it("sorts owned and discovered packages by latest submitted first", () => {
    expect(
      getContributorOwnedPackages(metadata, "alice").map((x) => x.name),
    ).toEqual([
      "com.example.both",
      "com.example.parent",
      "com.example.owner",
      "com.example.local-only",
    ]);
    expect(
      getContributorDiscoveredPackages(metadata, "alice").map((x) => x.name),
    ).toEqual(["com.example.both", "com.example.discovered"]);
  });

  it("keeps local-only packages without remote or published metadata", () => {
    const packageMetadata = toPackageMetadata(metadata[4]);

    expect(packageMetadata.name).toEqual("com.example.local-only");
    expect(packageMetadata.ver).toBeNull();
    expect(packageMetadata.repoUnavailable).toBe(false);
  });

  it("reports empty owned and discovered sections", () => {
    expect(getContributorOwnedPackages(metadata, "nobody")).toEqual([]);
    expect(getContributorDiscoveredPackages(metadata, "nobody")).toEqual([]);
    expect(getContributorProfileStats(metadata, "nobody")).toEqual({
      ownedCount: 0,
      discoveredCount: 0,
      totalSubmittedCount: 0,
    });
  });

  it("formats submitted package rows for the table", () => {
    expect(formatPackageSubmittedDate(1700000000000)).toEqual("2023-11-14");
    expect(formatPackageSubmittedDate(undefined)).toEqual("-");
    expect(toContributorProfilePackageEntry(metadata[0])).toEqual({
      name: "com.example.owner",
      displayName: "Owner Package",
      createdAt: 1700000000000,
      createdAtText: "2023-11-14",
      path: "/packages/com.example.owner/",
    });
  });

  it("renders separate owned and discovered tables without version filtering or package cards", () => {
    const source = readFileSync(layoutPath, "utf8");

    expect(source).toContain('<ul class="breadcrumb profile-breadcrumb">');
    expect(source).toContain('class="breadcrumb-item"');
    expect(source).toContain('<AutoLink :item="homeLink" />');
    expect(source).toContain('<AutoLink :item="contributorsLink" />');
    expect(source).toContain("Owned packages");
    expect(source).toContain("Discovered packages");
    expect(source).toContain("Display name");
    expect(source).toContain("Package name");
    expect(source).toContain("Submitted");
    expect(source).toContain("package-table");
    expect(source).toContain("GitHub profile");
    expect(source).toContain("align-items: center;");
    expect(source).not.toContain("OpenUPM profile");
    expect(source).not.toContain("totalSubmittedCount }} submitted");
    expect(source).not.toContain("sidebar-top");
    expect(source).not.toContain("table-striped");
    expect(source).not.toContain("PackageCard");
    expect(source).not.toContain(".filter((x) => x.ver)");
  });

  it("renders contributor badges from generated frontmatter", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");
    const badgeWallSource = readFileSync(badgeWallPath, "utf8");
    const badgeIconSource = readFileSync(
      fileURLToPath(
        new URL(
          "../../docs/.vuepress/components/ContributorBadgeIcon.vue",
          import.meta.url,
        ),
      ),
      "utf8",
    );
    const profileActionsIndex = layoutSource.indexOf('class="profile-actions"');
    const headerCloseIndex = layoutSource.indexOf("</header>");
    const badgeWallIndex = layoutSource.indexOf("<ContributorBadgeWall");

    expect(layoutSource).toContain("badges?: ContributorBadge[]");
    expect(profileActionsIndex).toBeGreaterThan(-1);
    expect(badgeWallIndex).toBeGreaterThan(profileActionsIndex);
    expect(badgeWallIndex).toBeGreaterThan(headerCloseIndex);
    expect(layoutSource).toContain('<ContributorBadgeWall :badges="badges" />');
    expect(badgeWallSource).toContain('class="profile-badges"');
    expect(badgeWallSource).toContain("Contributor badge wall");
    expect(badgeWallSource).toContain("ContributorBadgeIcon");
    expect(badgeIconSource).toContain('viewBox="0 0 70 70"');
    expect(badgeIconSource).toContain('width="70"');
    expect(badgeIconSource).toContain('height="70"');
    expect(badgeIconSource).toContain("icon === 'trophy'");
    expect(badgeIconSource).toContain("icon === 'coin'");
    expect(badgeIconSource).toContain("icon === 'year-search'");
    expect(badgeIconSource).toContain("icon === 'year-box'");
    expect(badgeIconSource).toContain("badge-year-metric");
    expect(badgeIconSource).toContain("badge-year-mark");
    expect(badgeWallSource).toContain("getBadgeIconLabel");
    expect(badgeWallSource).toContain("`${badge.tier}`");
    expect(badgeWallSource).toContain("`${badge.year}`");
    expect(badgeWallSource).toContain("getBadgeStyle");
    expect(badgeWallSource).toContain('"--badge-accent"');
    expect(badgeIconSource).toContain("badge-trophy-metric");
    expect(badgeIconSource).toContain('dominant-baseline="middle"');
    expect(badgeWallSource).toContain("getBadgeAriaLabel");
    expect(badgeWallSource).toContain('badge.category === "rank"');
    expect(badgeWallSource).toContain("`Top ${badge.tier}`");
    expect(badgeWallSource).toContain("`${badge.tier}+`");
    expect(badgeWallSource).toContain('role="tooltip"');
    expect(badgeWallSource).toContain("profile-badge-tooltip");
    expect(badgeIconSource).toContain("badge-disc");
    expect(badgeIconSource).toContain("badge-ring");
    expect(badgeIconSource).toContain("badge-mark");
    expect(badgeWallSource).toContain("profile-badge-title");
    expect(badgeWallSource).toContain("profile-badge-description");
    expect(badgeWallSource).not.toContain("fa-box-open");
    expect(badgeWallSource).not.toContain("fa-trophy");
  });

  it("provides a contributor badge review page with all badge rules", () => {
    const source = readFileSync(badgeReviewPagePath, "utf8");
    const configSource = readFileSync(docsConfigPath, "utf8");

    expect(source).toContain("badgeExamples:");
    expect(source).not.toContain("sidebar: false");
    expect(source).toContain("package-hunter-1");
    expect(source).toContain("package-hunter-100");
    expect(source).toContain("package-owner-1");
    expect(source).toContain("package-owner-100");
    expect(source).toContain("package-hunter-2021");
    expect(source).toContain("package-hunter-2026");
    expect(source).not.toContain("package-hunter-2027");
    expect(source).toContain("package-owner-2021");
    expect(source).toContain("package-owner-2026");
    expect(source).not.toContain("package-owner-2027");
    expect(source).toContain("icon: year-search");
    expect(source).toContain("icon: year-box");
    expect(source).toContain('accent: "#5b6889"');
    expect(source).toContain('accent: "#765776"');
    expect(source).toContain("top-package-hunter-10");
    expect(source).toContain("top-package-hunter-100");
    expect(source).toContain("top-package-owner-10");
    expect(source).toContain("top-package-owner-100");
    expect(source).toContain("early-contributor");
    expect(source).toContain("current-backer");
    expect(source).toContain("former-backer");
    expect(source).toContain("tone: hunter");
    expect(source).toContain("tone: owner");
    expect(source).toContain("icon: coin");
    expect(source).toContain("tone: muted");
    expect(source).toContain("<ContributorBadgeWall");

    expect(readFileSync(contributorsPagePath, "utf8")).toContain(
      "[Contributor badge reference](/docs/contributor-badges/)",
    );
    expect(configSource).toContain(
      'children: ["/support/", "/contributors/", "/docs/contributor-badges/"]',
    );
  });

  it("documents reusable contributor badge icon styles in the design docs", () => {
    const source = readFileSync(styleCheatsheetPath, "utf8");
    const designNotesSource = readFileSync(designNotesPath, "utf8");

    expect(source).toContain("### Badge Icons");
    expect(source).toContain("ContributorBadgeIcon");
    expect(source).toContain('<ContributorBadgeIcon icon="search" />');
    expect(source).toContain('<ContributorBadgeIcon icon="box" label="25+" />');
    expect(source).toContain(
      '<ContributorBadgeIcon icon="trophy" label="10" />',
    );
    expect(source).toContain(
      '<ContributorBadgeIcon icon="year-search" label="2026" />',
    );
    expect(source).toContain("keep the full `Top 10` wording");
    expect(source).toContain("feature the four-digit year");
    expect(source).toContain("Render at `70x70`");
    expect(source).toContain("Set tone through `currentColor`");
    expect(source).toContain("`hunter`: `#2f7d78`");
    expect(source).toContain("`muted`: `#7a7f87`");
    expect(designNotesSource).toContain("## Contributor Badge Icons");
    expect(designNotesSource).toContain("Use `ContributorBadgeIcon`");
    expect(designNotesSource).toContain("70x70 SVG widget");
    expect(designNotesSource).toContain("current and former backers");
    expect(designNotesSource).toContain("put only the number in the icon");
    expect(designNotesSource).toContain("For year badges");
    expect(designNotesSource).toContain("`year-search`");
    expect(designNotesSource).toContain("`year-box`");
  });

  it("uses AutoLink for external profile links with theme external-link behavior", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain('class="nav-link external github-link"');
    expect(layoutSource).toContain(':item="githubLink"');
    expect(layoutSource).toContain("font-size: 0.8rem");
    expect(layoutSource).toContain("isGitHubProfileHost");
    expect(layoutSource).toContain('hostname === "github.com"');
    expect(layoutSource).toContain('hostname.endsWith(".github.com")');
    expect(layoutSource).toContain('"GitHub profile"');
    expect(layoutSource).toContain("`${profileHost} profile`");
    expect(layoutSource).toContain("link: githubUrl.value");
  });

  it("generates contributor profile pages without a sidebar", () => {
    const source = readFileSync(pluginPath, "utf8");

    expect(source).toContain("layout: 'ContributorProfileLayout'");
    expect(source).toContain("sidebar: false");
    expect(source).toContain("backers");
    expect(source).toContain(
      "buildContributorProfile(githubUser, metadataLocalList",
    );
  });

  it("links package metadata to OpenUPM contributor profiles", () => {
    const metadataViewSource = readFileSync(packageMetadataViewPath, "utf8");

    expect(metadataViewSource).toContain("getContributorProfilePagePath");
  });

  it("lets contributor list data override avatar links", () => {
    const githubAvatarSource = readFileSync(githubAvatarPath, "utf8");
    const pluginSource = readFileSync(pluginPath, "utf8");

    expect(githubAvatarSource).toContain("url?: string");
    expect(githubAvatarSource).toContain("props.profile.url ||");
    expect(githubAvatarSource).toContain('rel="noopener noreferrer"');
    expect(pluginSource).toContain("addContributorProfileUrls");
    expect(pluginSource).toContain("page.frontmatter.backers");
  });

  it("keeps non-GitHub parent owner chips on their original upstream profile URL", () => {
    const metadataViewSource = readFileSync(packageMetadataViewPath, "utf8");

    expect(metadataViewSource).toContain("isGithubProfileUrl");
    expect(metadataViewSource).toContain('hostname === "github.com"');
    expect(metadataViewSource).toContain('hostname === "www.github.com"');
    expect(metadataViewSource).toContain(
      "external: Boolean(profileUrl && !isGithubProfile)",
    );
    expect(metadataViewSource).toContain(
      "parentOwnerNavLink && parentOwnerNavLink.external && parentOwnerNavLink.link",
    );
    expect(metadataViewSource).toContain(": profileUrl");
  });

  it("keeps non-GitHub owner and hunter chips on their original upstream profile URLs", () => {
    const metadataViewSource = readFileSync(packageMetadataViewPath, "utf8");

    expect(metadataViewSource).toContain("props.metadata.ownerUrl");
    expect(metadataViewSource).toContain("props.metadata.hunterUrl");
    expect(metadataViewSource).toContain(
      "ownerNavLink && ownerNavLink.external && ownerNavLink.link",
    );
    expect(metadataViewSource).toContain(
      "hunterNavLink && hunterNavLink.external && hunterNavLink.link",
    );
  });

  it("routes contributor avatar profile links through RouterLink", () => {
    const githubAvatarSource = readFileSync(githubAvatarPath, "utf8");

    expect(githubAvatarSource).toContain(
      '<RouterLink v-if="isInternalLink" :to="linkUrl">',
    );
    expect(githubAvatarSource).toContain(
      '<a v-else :href="linkUrl" rel="noopener noreferrer">',
    );
  });

  it("uses the contributor profile URL and host from generated frontmatter", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain("profileUrl");
    expect(layoutSource).toContain("profileHost");
    expect(layoutSource).toContain("`${profileHost} profile`");
  });
});
