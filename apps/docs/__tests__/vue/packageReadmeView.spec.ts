import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/PackageReadmeView.vue",
    import.meta.url,
  ),
);
const readmeHtmlPath = fileURLToPath(
  new URL("../../docs/.vuepress/components/ReadmeHtml.vue", import.meta.url),
);
const adDemoPagePath = fileURLToPath(
  new URL("../../docs/docs/dev/readme-ad-placement.md", import.meta.url),
);
const adDemoComponentPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/ReadmeAdPlacementDemo.vue",
    import.meta.url,
  ),
);

describe("PackageReadmeView", () => {
  const source = readFileSync(componentPath, "utf8");

  it("renders the README sync footer only when a timestamp formats successfully", () => {
    expect(source).toContain("readmeUpdatedAt: {");
    expect(source).toContain('if (!props.readmeUpdatedAt) return "";');
    expect(source).toContain(
      '<footer v-if="readmeSyncedAgo" class="readme-footer">',
    );
    expect(source).toContain(
      't("readme-synced-ago", { time: readmeSyncedAgo })',
    );
  });

  it("refreshes in-article ad placement after README HTML changes", () => {
    const readmeHtmlSource = readFileSync(readmeHtmlPath, "utf8");

    expect(readmeHtmlSource).toContain("addAdsenseInArticleAds(element);");
    expect(readmeHtmlSource).toContain(
      "watch(() => props.content, enhanceReadmeHtml);",
    );
  });

  it("has a docs development page for README ad placement behavior", () => {
    const pageSource = readFileSync(adDemoPagePath, "utf8");
    const componentSource = readFileSync(adDemoComponentPath, "utf8");

    expect(pageSource).toContain("<ReadmeAdPlacementDemo />");
    expect(componentSource).toContain("PackageReadmeView");
    expect(componentSource).toContain("Balanced Sections");
    expect(componentSource).toContain("No Sections");
  });
});
