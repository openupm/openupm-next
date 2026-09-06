# Blog Post Workflow

- New blog posts live at `apps/docs/docs/blog/<slug>/index.md`.
- Add each new blog post to `BLOG_POSTS` in
  `apps/docs/docs/.vuepress/blog.ts`; this drives the blog index, adjacent
  post navigation, and RSS metadata.
- Keep blog frontmatter aligned with the `BlogPost` metadata entry: `title`,
  `author`, `date`, `readingTime`, and `description`/`excerpt` should describe
  the same post.
- Use the current US Eastern calendar date (`America/New_York`) for new posts
  unless the user explicitly asks for a different publish date. Keep dates as
  `YYYY-MM-DD`. This avoids future-dated blog metadata when GitHub-hosted
  review and publishing automation evaluates the PR from a US timestamp.
- Keep frontmatter concise: `title`, `author`, `date`, `readingTime`,
  `description`, and usually `editLink: false`.
- If a post has a main image for listing, hero, cover, banner, or social
  sharing, set the post frontmatter `cover` to that public image path so
  `@vuepress/plugin-seo` uses it for `og:image` and Article JSON-LD image
  metadata. The plugin checks `banner` first, then `cover`; prefer `cover` for
  normal blog posts.
- When generating or regenerating blog hero images from the OpenUPM operator
  workspace, use the workspace-level skill/reference at
  `.agents/skills/openupm-blog-writing/references/hero-images.md`. Keep cover
  images 16:9, use OpenUPM blue `#3068E5` as the base color, avoid repeating
  the title text in the image by default, and prefer one or two main visual
  elements with an absolute maximum of five.
- For a new post, start by reading a recent nearby post and `BLOG_POSTS` so the
  title style, metadata, and closing navigation match the site.
- Add `<BlogPostMeta />` after the H1 and `<BlogPostNav />` at the end unless
  there is a strong reason to follow a different legacy post format.
- Keep posts user-facing. Avoid implementation details such as internal build
  strategy, cache mechanics, deployment topology, local paths, private hostnames,
  LAN URLs, or temporary preview URLs unless the user specifically asks for
  operator notes outside the public repo.
- Use Markdown links for referenced articles, package pages, docs pages, issues,
  and examples. Avoid bare URLs in prose, especially URLs copied from local
  staging or development output.
- Prefer relative links for OpenUPM site pages, for example
  `[NuGet Packages](/nuget/)` or
  `[org.nuget.system](/packages/?q=org.nuget.system)`.
- When linking package examples, use the package name as link text instead of
  showing the full URL.
- Make limitations accurate without overexplaining internals. If a feature is
  searchable but not part of the normal filterable package list, state both
  surfaces explicitly.
- Blog ordering tests should verify general ordering behavior, such as dates
  sorted newest first, rather than hard-coding the current first or last post
  unless the test is intentionally covering a specific legacy post.
- For blog-only changes, run `npm run test -- blog.spec.ts` and
  `npm run lint` from `apps/docs`, then run `npm run docs:build:limit`. Use
  `mise exec --` for those commands when needed.
- If a VuePress dev server is already running, stop it before
  `docs:build:limit`; the build cleans `.vuepress/.temp` and can conflict with
  a live dev server.
- When the user wants to review the post locally, start the dev server from
  `apps/docs` with:
  `VITE_OPENUPM_API_SERVER_URL=https://api.openupm.com npm run docs:dev -- --host 0.0.0.0 --port 8080`.
- Before starting the review server, check whether the port is already in use.
  If it is, either stop the stale server or choose another port and report that
  port.
- For LAN review, bind to `0.0.0.0`, determine the active LAN address from the
  machine, and give the user a concrete `http://<lan-ip>:<port>/...` URL for
  the page they should review. Do not commit that LAN URL to the repo or include
  it in public PR text.
