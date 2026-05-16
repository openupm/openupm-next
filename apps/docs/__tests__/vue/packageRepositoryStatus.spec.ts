import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packageCardPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/PackageCard.vue", import.meta.url),
);
const packageDetailLayoutPath = fileURLToPath(
  new URL("../../docs/.vuepress/layouts/PackageDetailLayout.vue", import.meta.url),
);
const localePath = fileURLToPath(
  new URL("../../docs/.vuepress/locales/en-US.yml", import.meta.url),
);

describe("package repository status UI", () => {
  it("renders an archived chip on package cards when remote metadata is archived", () => {
    const source = readFileSync(packageCardPath, "utf8");

    expect(source).toContain('v-if="metadata.repoArchived"');
    expect(source).toContain("Archived");
  });

  it("renders archived and unavailable repository status conditions independently", () => {
    const source = readFileSync(packageDetailLayoutPath, "utf8");

    expect(source).toContain('v-if="packageMetadata.repoUnavailable"');
    expect(source).toContain('v-if="packageMetadata.repoArchived"');
    expect(source).toContain('repository-is-unavailable-title');
    expect(source).toContain('repository-is-archived-title');
    expect(source).toContain('repository-is-archived-desc');
  });

  it("defines archived repository status copy", () => {
    const source = readFileSync(localePath, "utf8");

    expect(source).toContain(
      "repository-is-archived-title: The source code repository is archived",
    );
    expect(source).toContain("repository-is-archived-desc:");
  });
});
