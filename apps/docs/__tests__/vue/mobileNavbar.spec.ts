import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const vuepressRoot = resolve(__dirname, "../../docs/.vuepress");

const readVuepressFile = (path: string): string =>
  readFileSync(resolve(vuepressRoot, path), "utf8");

describe("mobile navbar", () => {
  it("keeps the default mobile sidebar available on no-sidebar pages", () => {
    const demoSource = readVuepressFile(
      "components/ReadmeMarkdownRendererDemo.vue",
    );

    expect(demoSource).not.toContain(
      ".vp-theme-container.wide-layout.no-sidebar .vp-sidebar",
    );
    expect(demoSource).not.toContain(
      ".vp-theme-container.wide-layout.no-sidebar .vp-sidebar-mask",
    );
  });
});
