import chai from "chai";
import { describe, it } from "vitest";

import {
  BLOG_POSTS,
  generateBlogRss,
  getAdjacentBlogPosts,
  getAbsoluteBlogPostUrl,
  getBlogPostsNewestFirst,
} from "@/blog";

chai.should();

describe("blog metadata", () => {
  it("preserves Medium URL path segments as OpenUPM blog slugs", () => {
    for (const post of BLOG_POSTS) {
      if (!post.originalUrl) {
        continue;
      }

      const originalPathSegment = new URL(post.originalUrl).pathname
        .split("/")
        .filter(Boolean)
        .at(-1);

      originalPathSegment?.should.equal(post.slug);
    }
  });

  it("orders posts newest first", () => {
    const posts = getBlogPostsNewestFirst();

    for (let i = 1; i < posts.length; i += 1) {
      new Date(posts[i - 1].date).getTime().should.be.gte(
        new Date(posts[i].date).getTime(),
      );
    }
  });

  it("returns previous and next posts in chronological order", () => {
    const adjacent = getAdjacentBlogPosts("openupm-round-up-72796259b288");

    adjacent.previous?.slug.should.equal(
      "how-to-maintain-upm-package-part-3-2d08294269ad",
    );
    adjacent.next?.slug.should.equal(
      "how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163",
    );
  });

  it("generates RSS with stable absolute blog URLs", () => {
    const rss = generateBlogRss();

    rss.should.contain("<rss version=\"2.0\"");
    rss.should.contain("<title>OpenUPM Blog</title>");
    rss.should.contain(getAbsoluteBlogPostUrl("openupm-2025-recap-6283fcd0217e"));
    rss.should.not.contain("medium.com/openupm/openupm-2025-recap-6283fcd0217e");
  });
});
