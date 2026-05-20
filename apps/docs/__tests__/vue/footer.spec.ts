import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const footerPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/Footer.vue", import.meta.url),
);

const layoutPath = fileURLToPath(
  new URL("../../docs/.vuepress/layouts/Layout.vue", import.meta.url),
);

describe("Footer", () => {
  const source = readFileSync(footerPath, "utf8");

  it("renders as a full-bleed normal-flow section", () => {
    expect(source).toContain("background-color: $primary-color;");
    expect(source).not.toContain("100vw");
    expect(source).not.toContain("position: absolute;");
  });

  it("removes inherited page bottom padding only when the site footer is present", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain(
      '<ParentLayout :class="{ \'has-page-footer\': showFooter }">',
    );
    expect(layoutSource).toContain('<Footer v-if="showFooter" />');
    expect(layoutSource).toContain(".has-page-footer");
    expect(layoutSource).toContain("padding-bottom: 0;");
  });
});
