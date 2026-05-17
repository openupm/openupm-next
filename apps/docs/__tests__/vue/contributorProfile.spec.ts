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

const packageMetadataViewPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageMetadataView.vue",
    import.meta.url,
  ),
);
const githubAvatarPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/GitHubAvatar.vue",
    import.meta.url,
  ),
);
const pluginPath = fileURLToPath(
  new URL(
    "../../../../packages/vuepress-plugin-openupm/src/index.ts",
    import.meta.url,
  ),
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
    expect(getContributorOwnedPackages(metadata, "alice").map((x) => x.name)).toContain(
      "com.example.owner",
    );
  });

  it("matches owned packages by GitHub parent owner case-insensitively", () => {
    expect(getContributorOwnedPackages(metadata, "Alice").map((x) => x.name)).toContain(
      "com.example.parent",
    );
  });

  it("matches discovered packages by hunter case-insensitively", () => {
    expect(
      getContributorDiscoveredPackages(metadata, "alice").map((x) => x.name),
    ).toContain("com.example.discovered");
  });

  it("allows the same user to appear in both sections", () => {
    expect(getContributorOwnedPackages(metadata, "alice").map((x) => x.name)).toContain(
      "com.example.both",
    );
    expect(
      getContributorDiscoveredPackages(metadata, "alice").map((x) => x.name),
    ).toContain("com.example.both");
  });

  it("sorts owned and discovered packages by latest submitted first", () => {
    expect(getContributorOwnedPackages(metadata, "alice").map((x) => x.name)).toEqual([
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
    expect(source).toContain("class=\"breadcrumb-item\"");
    expect(source).toContain('<AutoLink :item="contributorsLink" />');
    expect(source).toContain("Owned packages");
    expect(source).toContain("Discovered packages");
    expect(source).toContain("Display name");
    expect(source).toContain("Package name");
    expect(source).toContain("Submitted");
    expect(source).toContain("package-table");
    expect(source).toContain("GitHub profile");
    expect(source).not.toContain("OpenUPM profile");
    expect(source).not.toContain("totalSubmittedCount }} submitted");
    expect(source).not.toContain("sidebar-top");
    expect(source).not.toContain("table-striped");
    expect(source).not.toContain("PackageCard");
    expect(source).not.toContain(".filter((x) => x.ver)");
  });

  it("uses AutoLink for external profile links with theme external-link behavior", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain(
      '<AutoLink class="nav-link external github-link" :item="githubLink" />',
    );
    expect(layoutSource).toContain("font-size: 0.8rem");
    expect(layoutSource).toContain("isGitHubProfileHost");
    expect(layoutSource).toContain('hostname === "github.com"');
    expect(layoutSource).toContain('hostname.endsWith(".github.com")');
    expect(layoutSource).toContain('"GitHub profile"');
    expect(layoutSource).toContain('`${profileHost} profile`');
    expect(layoutSource).toContain("link: githubUrl.value");
  });

  it("generates contributor profile pages without a sidebar", () => {
    const source = readFileSync(pluginPath, "utf8");

    expect(source).toContain("layout: 'ContributorProfileLayout'");
    expect(source).toContain("sidebar: false");
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
    expect(metadataViewSource).toContain("external: Boolean(profileUrl && !isGithubProfile)");
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

    expect(githubAvatarSource).toContain('<RouterLink v-if="isInternalLink" :to="linkUrl">');
    expect(githubAvatarSource).toContain('<a v-else :href="linkUrl" rel="noopener noreferrer">');
  });

  it("uses the contributor profile URL and host from generated frontmatter", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain("profileUrl");
    expect(layoutSource).toContain("profileHost");
    expect(layoutSource).toContain('`${profileHost} profile`');
  });
});
