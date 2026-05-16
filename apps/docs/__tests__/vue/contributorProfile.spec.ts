import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PackageMetadataLocal } from "@openupm/types";
import { describe, expect, it } from "vitest";

import {
  getContributorDiscoveredPackages,
  getContributorOwnedPackages,
  getContributorProfileStats,
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

const packageCardPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/PackageCard.vue", import.meta.url),
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
  },
  {
    name: "com.example.parent",
    owner: "fork-owner",
    parentOwner: "alice",
    hunter: "dave",
    displayName: "Parent Package",
    description: "",
    topics: [],
  },
  {
    name: "com.example.discovered",
    owner: "bob",
    parentOwner: null,
    hunter: "ALICE",
    displayName: "Discovered Package",
    description: "",
    topics: [],
  },
  {
    name: "com.example.both",
    owner: "Alice",
    parentOwner: null,
    hunter: "alice",
    displayName: "Both Package",
    description: "",
    topics: [],
  },
  {
    name: "com.example.local-only",
    owner: "alice",
    parentOwner: null,
    hunter: "eve",
    displayName: "Local Only Package",
    description: "",
    topics: [],
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

  it("renders separate owned and discovered sections without version filtering", () => {
    const source = readFileSync(layoutPath, "utf8");

    expect(source).toContain("Owned packages");
    expect(source).toContain("Discovered packages");
    expect(source).toContain("PackageCard");
    expect(source).not.toContain(".filter((x) => x.ver)");
  });

  it("links package metadata and package cards to OpenUPM contributor profiles", () => {
    const metadataViewSource = readFileSync(packageMetadataViewPath, "utf8");
    const packageCardSource = readFileSync(packageCardPath, "utf8");

    expect(metadataViewSource).toContain("getContributorProfilePagePath");
    expect(packageCardSource).toContain("getContributorProfilePagePath");
  });

  it("keeps non-GitHub parent owner chips on their original upstream profile URL", () => {
    const metadataViewSource = readFileSync(packageMetadataViewPath, "utf8");

    expect(metadataViewSource).toContain('toLowerCase()');
    expect(metadataViewSource).toContain('.includes("github")');
    expect(metadataViewSource).toContain("external: !isGithubParentOwner");
    expect(metadataViewSource).toContain(
      "parentOwnerNavLink && parentOwnerNavLink.external && parentOwnerNavLink.link",
    );
    expect(metadataViewSource).toContain(": parentOwnerUrl");
  });
});
