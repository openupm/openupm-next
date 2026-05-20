import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(__dirname, "../docs");

const readDocsFile = (relativePath: string): string =>
  readFileSync(resolve(docsRoot, relativePath), "utf8");

describe("docs SEO content links", () => {
  it("adds the scoped registry troubleshooting page to the docs sidebar", () => {
    const config = readDocsFile(".vuepress/config-us.ts");

    expect(config).toContain("/docs/scoped-registry-troubleshooting");
  });

  it("links high-intent docs pages to scoped registry troubleshooting", () => {
    const linkedDocs = [
      "docs/index.md",
      "docs/getting-started.md",
      "docs/getting-started-cli.md",
      "docs/adding-upm-package.md",
      "docs/host-private-upm-registry-15-minutes.md",
      "nuget/index.md",
    ];

    for (const relativePath of linkedDocs) {
      expect(readDocsFile(relativePath)).toContain(
        "scoped-registry-troubleshooting",
      );
    }
  });

  it("sets search-focused docs index metadata", () => {
    const page = readDocsFile("docs/index.md");

    expect(page).toContain(
      "title: OpenUPM Unity Package Manager Registry Docs",
    );
    expect(page).toContain(
      "description: Set up OpenUPM for Unity Package Manager packages",
    );
    expect(page).toContain("# OpenUPM Unity Package Manager Registry Docs");
  });

  it("keeps the troubleshooting page indexable and connected to package paths", () => {
    const page = readDocsFile("docs/scoped-registry-troubleshooting.md");

    expect(page).not.toContain("noindex");
    expect(page).not.toContain("nofollow");
    expect(page).toContain("/packages/com.cysharp.unitask/");
    expect(page).toContain("/packages/org.nuget.newtonsoft.json/");
    expect(page).not.toContain("Publishing and Metadata Issues");
  });
});
