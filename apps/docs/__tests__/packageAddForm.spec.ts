import { describe, expect, it } from "vitest";

import { getPackageAddFormDefaultReadme } from "../docs/.vuepress/packageAddForm";

describe("package add form README default", () => {
  it("prefers README.md adjacent to the selected package.json", () => {
    expect(
      getPackageAddFormDefaultReadme(
        ["README.md", "Packages/com.example.foo/README.md"],
        "Packages/com.example.foo/package.json",
      ),
    ).toBe("Packages/com.example.foo/README.md");
  });

  it("falls back to the existing root README.md default when no adjacent README.md exists", () => {
    expect(
      getPackageAddFormDefaultReadme(
        ["README.md", "Packages/com.example.foo/CHANGELOG.md"],
        "Packages/com.example.foo/package.json",
      ),
    ).toBe("README.md");
  });

  it("falls back to the existing first nested README.md default when no root or adjacent README.md exists", () => {
    expect(
      getPackageAddFormDefaultReadme(
        ["Packages/com.example.bar/README.md", "Packages/com.example.foo/CHANGELOG.md"],
        "Packages/com.example.foo/package.json",
      ),
    ).toBe("Packages/com.example.bar/README.md");
  });

  it("falls back to the existing single markdown file default", () => {
    expect(
      getPackageAddFormDefaultReadme(
        ["Documentation~/Manual.md"],
        "Packages/com.example.foo/package.json",
      ),
    ).toBe("Documentation~/Manual.md");
  });

  it("keeps no default when no markdown files exist", () => {
    expect(
      getPackageAddFormDefaultReadme(
        [],
        "Packages/com.example.foo/package.json",
      ),
    ).toBeNull();
  });

  it("uses root README.md when the selected package.json is at the repository root", () => {
    expect(
      getPackageAddFormDefaultReadme(
        ["README.md", "Packages/com.example.foo/README.md"],
        "package.json",
      ),
    ).toBe("README.md");
  });
});
