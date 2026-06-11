# OpenUPM Next Agent Notes

## Repo Shape

- `apps/web`: API server
- `apps/jobs`: background jobs / CLI entrypoints
- `apps/docs`: VuePress static site
- `packages/@openupm/*`: shared internal libraries
- `packages/vuepress-plugin-openupm`: docs-only VuePress plugin
- `tooling/*`: shared repo tooling and presets

## Tooling Baseline

- Node is pinned with Volta at `22.19.0`
- Package manager is `npm@10.9.3`
- Task runner is Turbo (`npm run lint`, `npm run build`, `npm test`)
- Tests use Vitest across the workspace
- If Volta is not active in the current shell, run npm through the pinned
  version, for example `npx npm@10.9.3 install`, so `package-lock.json` is not
  rewritten by a newer global npm.

## Working Rules

- Run `npm run lint` explicitly. `build` and `test` do not run lint for you.
- Root `npm test` runs `turbo run test`, and Turbo runs each package `build` before `test`.
- If you need a clean rebuild, use `npm run build:release -- --force` or `npm test -- --force`.
- When documenting validation in PRs or issues, do not include machine-local
  absolute paths. Replace local worktree paths with placeholders such as
  `<openupm-next-worktree>` or use repo-relative paths.
- Focused workspace package tests may require built internal dependencies. For
  `@openupm/local-data`, build `@openupm/types`, `@openupm/test`, and
  `@openupm/common` before running the package test directly in a fresh
  worktree.
- Prefer changing shared config in `tooling/` rather than duplicating per-package config.
- When working from a plan, after finishing any item, always state the next
  concrete step. Continue doing this until the plan is genuinely complete so
  the user does not need to ask "what's next?".

## Queue CLI Notes

- `apps/queue` owns the maintained `queue-cli` entry point for BullMQ package
  and release queue operations. See `apps/queue/README.md` and
  `node build/index.js queue-cli --help`.
- Keep `queue-cli --help` and subcommand help self-contained when changing CLI
  behavior; tests in `apps/queue/__tests__/queueCli*.spec.ts` should cover
  destructive commands and defaults.
- `queue-jobs` returns all matching jobs when `--limit` is omitted. Preserve
  explicit `--limit` for large or scripted inspections.
- Destructive commands are `remove-job`, `release-remove`, `release-requeue`,
  `package-requeue`, and `cleanup-missing-packages`; validate them with focused
  tests before deploy.
- Do not put private production hostnames, paths, or sudo wrapper details in
  this public application repo. Production invocation belongs in
  `openupm-devops`.

## Docs App Notes

- Docs commands run from `apps/docs`.
- Keep operator-only SEO measurement tooling outside this application
  repository. Use the standalone workspace sibling `openupm-seo-tools` for
  Search Console, PageSpeed, CrUX, Lighthouse, baseline reports, API keys,
  OAuth refresh tokens, and private measurement artifacts. Do not add root
  package scripts, docs app scripts, workspace packages, public docs, or
  generated site assets that reveal or depend on that tooling.
- If a docs client/site change needs human visual review, do not merge the PR
  after CI or automated review alone. `openupm-next` client-side docs changes
  can deploy automatically after merge, so stop at a ready PR plus local or
  staging review URL until the user explicitly approves merging/deploying.
- `npm run docs:build:limit` is the fastest full SSR build smoke test for the docs app.
- For docs client/site changes with meaningful browser behavior, use
  Playwright for targeted e2e verification when practical. Prefer serving the
  built docs output or running the VuePress dev server, then verify the actual
  page behavior the user cares about: console errors, hydration warnings,
  interactive controls, chart labels/tooltips, rendered canvas counts, network
  status, dark/light theme behavior, and responsive viewport behavior.
- When using Playwright for local docs review, keep the same staging-server
  discipline as manual review: bind local dev servers to `0.0.0.0`, use an
  available port, and do not publish local ports, LAN URLs, screenshots, or
  workstation-specific paths in public PR text.
- Browser automation does not replace lint, unit tests, or SSR build checks.
  Report exactly what the Playwright probe covered and what it did not cover,
  especially when third-party resources such as ads, analytics, or cookie
  consent are blocked or allowed during the run.
- If the shell is not already using the repo-pinned Node/npm versions, run docs
  commands through Volta, for example `volta run npm run lint`.
- If `docs:build:limit` fails because
  `node_modules/vuepress-plugin-openupm/build/index.js` is missing, first build
  the local plugin dependency from the repo root with
  `npm run build -- --filter=vuepress-plugin-openupm`.
- The docs VuePress config contains Node 22 compatibility aliases for:
  - `date-fns/locale`
  - `@intlify/shared`
- Do not remove those aliases unless the upstream VuePress / Vue I18n dependency stack is upgraded and revalidated.

## Blog Post Workflow

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
  `volta run` for those commands when needed.
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

## Local Data

- Some packages read OpenUPM metadata from a local `data/` directory.
- In CI this is provided through `OPENUPM_DATA_PATH`.
- For local runs, prefer an untracked repo-root `.env.local` copied from
  `.env.local.example`:
  - `OPENUPM_DATA_PATH=/abs/path/to/openupm/data`
- Never commit `.env.local` or machine-specific local data paths.
- Shared Vitest setup loads repo-root dotenv files, so `npm test` and package
  Vitest runs can see this local override. For non-test shell commands, prefix
  the command with `OPENUPM_DATA_PATH=/abs/path/to/openupm/data` if the command
  does not load dotenv itself.

## Full Test Prerequisites

- Full `npm test` includes Redis-backed packages such as `@openupm/ads`,
  `@openupm/server-common`, and `apps/web`; Redis must be reachable on the
  configured test Redis host, usually `127.0.0.1:6379`.
- Focused Vitest targets can still need Redis. If a Redis-backed focused test
  times out or hangs while Redis is not running, start the same temporary Redis
  container before retrying the test.
- If local Redis is not already running, use the same Redis Stack image version
  defined for live deployment in `openupm-devops`:
  `docker run -d --name openupm-next-test-redis -p 6379:6379 redis/redis-stack-server:7.2.0-v10`.
  Remove it after testing with
  `docker rm -f openupm-next-test-redis`.

## Scaffolding

- Create a new Node package with:
  - `npm run new:node-package -- packages/@openupm/my-package @openupm/my-package`
