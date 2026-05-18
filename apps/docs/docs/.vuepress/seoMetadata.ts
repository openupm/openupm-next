import { statSync } from "node:fs";

import type { Page } from "@vuepress/core";

import { BLOG_POSTS } from "./blog";

const blogPostCoverByPath = new Map(
  BLOG_POSTS.filter((post) => post.featuredImage).map((post) => [
    `/blog/${post.slug}/`,
    post.featuredImage,
  ]),
);

const toIsoString = (value: unknown): string => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export const applyBlogSeoMetadata = (page: Page): void => {
  if (!page.path.startsWith("/blog/") || page.path === "/blog/") return;
  if (!page.frontmatter.cover) {
    const cover = blogPostCoverByPath.get(page.path);
    if (cover) page.frontmatter.cover = cover;
  }
};

export const getSitemapLastModified = (page: Page): string => {
  if (typeof page.frontmatter.lastmod === "string")
    return page.frontmatter.lastmod;
  const pageDate = toIsoString(page.frontmatter.date || page.frontmatter.time);
  if (pageDate) return pageDate;
  if (page.data.git?.updatedTime)
    return new Date(page.data.git.updatedTime).toISOString();
  if (page.filePath) {
    try {
      return statSync(page.filePath).mtime.toISOString();
    } catch {
      return "";
    }
  }
  return "";
};
