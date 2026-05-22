import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { paramCase } from "change-case";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { ReleaseErrorCode } from "@openupm/types";

const packagePipelinesViewPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackagePipelinesView.vue",
    import.meta.url,
  ),
);
const releaseErrorInfoPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/ReleaseErrorInfo.vue",
    import.meta.url,
  ),
);
const enLocalePath = fileURLToPath(
  new URL("../../docs/.vuepress/locales/en-US.yml", import.meta.url),
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

  it("renders failed release errors with the shared error details control", () => {
    const source = readFileSync(packagePipelinesViewPath, "utf8");

    expect(source).toContain("ReleaseErrorInfo");
    expect(source).toContain(':reason-code="entry.reason"');
    expect(source).toContain(
      ":build-url=\"entry.buildId ? entry.buildLink.link : ''\"",
    );
  });

  it("has friendly translation text for every release error code", () => {
    const locale = load(readFileSync(enLocalePath, "utf8")) as Record<
      string,
      string
    >;
    const enumNames = Object.values(ReleaseErrorCode).filter(
      (value): value is string => typeof value === "string",
    );

    for (const name of enumNames) {
      const key = `release-reason-${paramCase(name)}`;
      expect(locale[key], key).toBeTruthy();
      expect(locale[key], key).not.toBe(name);
    }

    expect(locale["release-reason-package-not-found"]).toBe(
      "error path package.json",
    );
    expect(locale["release-reason-version-mismatch"]).toBe(
      "package.json version does not match release version",
    );
    expect(locale["release-reason-gateway-timeout"]).toBe("upstream timeout");
  });

  it("derives the numeric error code from legacy reason-only queue payloads", () => {
    const source = readFileSync(releaseErrorInfoPath, "utf8");

    expect(source).toContain("const resolvedReasonCode = computed");
    expect(source).toContain("props.reasonCode !== undefined");
    expect(source).toContain(
      "reasonName.value as keyof typeof ReleaseErrorCode",
    );
    expect(source).toContain("const errorCodeText = computed");
  });
});
