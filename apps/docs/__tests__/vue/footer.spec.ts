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

  it("links footer RSS feeds to concrete feed URLs", () => {
    const packageUpdatesIndex = source.indexOf('text: t("package-updates")');
    const blogRssIndex = source.indexOf('text: t("blog-rss")');

    expect(source).toContain('link: `${getAPIBaseUrl()}/feeds/updates/rss`');
    expect(source).not.toContain('link: `{getAPIBaseUrl()}/feeds/updates/rss`');
    expect(source).toContain('link: "https://openupm.com/blog/rss.xml"');
    expect(packageUpdatesIndex).toBeGreaterThan(-1);
    expect(blogRssIndex).toBeGreaterThan(packageUpdatesIndex);
  });

  it("removes inherited page bottom padding only when the site footer is present", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain(
      '<ParentLayout v-bind="parentLayoutAttrs" :class="parentLayoutClass">',
    );
    expect(layoutSource).toContain('<Footer v-if="showFooter" />');
    expect(layoutSource).toContain(".has-page-footer");
    expect(layoutSource).toContain("padding-bottom: 0;");
  });

  it("forwards inherited layout classes through the fragment wrapper", () => {
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain("useAttrs");
    expect(layoutSource).toContain("const parentLayoutAttrs = computed");
    expect(layoutSource).toContain("const parentLayoutClass = computed");
    expect(layoutSource).toContain("attrs.class");
  });
});
