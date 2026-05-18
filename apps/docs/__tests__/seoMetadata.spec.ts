import { describe, expect, it } from "vitest";

import {
  applyBlogSeoMetadata,
  getSitemapLastModified,
} from "../docs/.vuepress/seoMetadata";

describe("docs SEO metadata", () => {
  it("fills missing blog cover metadata from BLOG_POSTS", () => {
    const page = {
      path: "/blog/openupm-2025-recap-6283fcd0217e/",
      frontmatter: {},
    };

    applyBlogSeoMetadata(page as never);

    expect(page.frontmatter).toMatchObject({
      cover: "/images/blog-covers/openupm-2025-recap-6283fcd0217e.png",
    });
  });

  it("keeps explicit blog cover metadata", () => {
    const page = {
      path: "/blog/contributor-profile-badges/",
      frontmatter: { cover: "/custom.png" },
    };

    applyBlogSeoMetadata(page as never);

    expect(page.frontmatter.cover).toBe("/custom.png");
  });

  it("uses frontmatter lastmod before falling back to build-time metadata", () => {
    expect(
      getSitemapLastModified({
        frontmatter: { lastmod: "2026-01-02T00:00:00.000Z" },
      } as never),
    ).toBe("2026-01-02T00:00:00.000Z");
  });

  it("uses blog dates as deterministic sitemap dates", () => {
    expect(
      getSitemapLastModified({
        frontmatter: { date: "2026-01-02" },
      } as never),
    ).toBe("2026-01-02T00:00:00.000Z");
  });
});
