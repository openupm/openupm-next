import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packagePipelinesViewPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackagePipelinesView.vue",
    import.meta.url,
  ),
);

describe("package pipelines UI", () => {
  it("displays publishedVersion with version fallback", () => {
    const source = readFileSync(packagePipelinesViewPath, "utf8");

    expect(source).toContain(
      "const displayVersion = x.publishedVersion || x.version;",
    );
    expect(source).toContain("{{ entry.displayVersion }}");
  });

  it("shows scheduled version when it differs from publishedVersion", () => {
    const source = readFileSync(packagePipelinesViewPath, "utf8");

    expect(source).toContain("const hasScheduledVersionMismatch =");
    expect(source).toContain('v-if="entry.hasScheduledVersionMismatch"');
    expect(source).toContain(':data-tooltip="entry.version"');
    expect(source).toContain("scheduled-version");
  });
});
