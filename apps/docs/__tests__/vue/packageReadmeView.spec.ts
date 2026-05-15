import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/PackageReadmeView.vue", import.meta.url),
);

describe("PackageReadmeView", () => {
  const source = readFileSync(componentPath, "utf8");

  it("renders the README sync footer only when a timestamp formats successfully", () => {
    expect(source).toContain('readmeUpdatedAt: {');
    expect(source).toContain('if (!props.readmeUpdatedAt) return "";');
    expect(source).toContain('<footer v-if="readmeSyncedAgo" class="readme-footer">');
    expect(source).toContain('t("readme-synced-ago", { time: readmeSyncedAgo })');
  });
});
