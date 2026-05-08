import { fs, path } from "@vuepress/utils";
import type { Plugin } from "vuepress";

import { BLOG_RSS_PATH, generateBlogRss } from "./blog";

export const blogRssPlugin = (): Plugin => ({
  name: "openupm-blog-rss",
  onGenerated: async (app): Promise<void> => {
    const rssPath = path.join(app.dir.dest(), BLOG_RSS_PATH);
    await fs.ensureDir(path.dirname(rssPath));
    await fs.writeFile(rssPath, generateBlogRss(), "utf8");
  },
});
