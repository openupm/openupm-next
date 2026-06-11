import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const breadcrumbPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/components/SiteBreadcrumb.vue",
    import.meta.url,
  ),
);

const layoutPath = fileURLToPath(
  new URL("../../docs/.vuepress/layouts/Layout.vue", import.meta.url),
);

const packageListLayoutPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/layouts/PackageListLayout.vue",
    import.meta.url,
  ),
);

const packageDetailLayoutPath = fileURLToPath(
  new URL(
    "../../docs/.vuepress/layouts/PackageDetailLayout.vue",
    import.meta.url,
  ),
);

describe("site breadcrumbs", () => {
  it("infers breadcrumbs for docs, blog, package, topic, and static pages", () => {
    const source = readFileSync(breadcrumbPath, "utf8");

    expect(source).toContain('path.startsWith("/docs/")');
    expect(source).toContain('path.startsWith("/blog/")');
    expect(source).toContain('path.startsWith("/packages/topics/")');
    expect(source).toContain('path.startsWith("/packages/")');
    expect(source).toContain('path === "/nuget/"');
    expect(source).toContain('path === "/support/"');
    expect(source).toContain('path === "/contributors/"');
  });

  it("renders the current page breadcrumb as non-link text", () => {
    const source = readFileSync(breadcrumbPath, "utf8");

    expect(source).toContain('{ text: "Home", link: "/" }');
    expect(source).toContain("visibleBreadcrumbItems");
    expect(source).toContain('<span v-else aria-current="page">');
    expect(source).not.toContain('href="#"');
  });

  it("renders breadcrumbs in the default layout for docs and blog pages", () => {
    const source = readFileSync(layoutPath, "utf8");

    expect(source).toContain("<SiteBreadcrumb />");
    expect(source).toContain("<AdsenseDisplayForContentTop");
  });

  it("passes exact package list and topic breadcrumb items", () => {
    const source = readFileSync(packageListLayoutPath, "utf8");

    expect(source).toContain("const breadcrumbItems = computed");
    expect(source).toContain('{ text: "Packages", link: "/packages/" }');
    expect(source).toContain('<SiteBreadcrumb :items="breadcrumbItems" />');
  });

  it("passes exact OpenUPM package detail breadcrumb items", () => {
    const source = readFileSync(packageDetailLayoutPath, "utf8");

    expect(source).toContain("const breadcrumbItems = computed");
    expect(source).toContain("packageMetadata.value.displayName");
    expect(source).toContain('<SiteBreadcrumb :items="breadcrumbItems" />');
  });
});
