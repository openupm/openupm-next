# OpenUPM Next Agent Notes

## Repo Shape

- `apps/web`: API server
- `apps/jobs`: background jobs / CLI entrypoints
- `apps/docs`: VuePress static site
- `packages/@openupm/*`: shared internal libraries
- `packages/vuepress-plugin-openupm`: docs-only VuePress plugin
- `tooling/*`: shared repo tooling and presets

## Tooling Baseline

- Node is pinned with mise at `22.19.0`
- Package manager is `npm@10.9.3`
- Task runner is Turbo (`npm run lint`, `npm run build`, `npm test`)
- Tests use Vitest across the workspace
- If mise is not active in the current shell, run npm through the pinned
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
  commands through mise, for example `mise exec -- npm run lint`.
- If `docs:build:limit` fails because
  `node_modules/vuepress-plugin-openupm/build/index.js` is missing, first build
  the local plugin dependency from the repo root with
  `npm run build -- --filter=vuepress-plugin-openupm`.
- The docs VuePress config contains Node 22 compatibility aliases for:
  - `date-fns/locale`
  - `@intlify/shared`
- Do not remove those aliases unless the upstream VuePress / Vue I18n dependency stack is upgraded and revalidated.

## Blog Post Workflow

Before creating or editing a blog post, its metadata, navigation, or cover image, read [docs/agent-blog-authoring.md](docs/agent-blog-authoring.md). Follow its authoring, validation, and local review requirements. The docs human-review and public/private boundaries above remain in force.

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

## Pull Request Delivery Workflow

Deliver repository changes through pull requests by default, regardless of
size. Do not make changes directly in the main checkout unless the user
explicitly approves an exception. Direct commits to `main` or the default
branch should be limited to explicit user-approved exceptions.

Work on a dedicated topic branch, using a separate worktree when required or
useful. Make the requested change, run relevant validation, and pass the review
gate below before committing or creating/updating a PR. Keep saved-plan
progress current and close the plan when its objective is complete. PRs should
describe the final scope and validation results.

When asked to prepare changes as PRs for review, finish with validated,
reviewed PRs and report remaining limitations. A read-only review ends with
findings and coverage limits; it does not authorize changes or PR creation.
For authorized delivery, continue through green checks,
merge, any explicitly authorized deployment, and verified cleanup. Use a
Conventional Commit PR title and squash subject when the repository uses them
to determine release versions.

Treat a request to `deploy`, `ship`, `publish`, or `deliver` the current
requested repository change set as authorization to complete this normal
topic-branch workflow: commit reviewed in-scope changes, push the topic branch,
create or update its pull request, monitor required checks, make narrowly scoped
fixes for failures caused by the change, merge when all gates pass, and remove
the clean merged worktree and merged topic branches under the cleanup checks
below. Apply required validation and review to every fix. Do not ask for
separate approval for each ordinary step.

This authorization applies only to the current requested repository change
set. It does not authorize force pushes; bypassing reviews, checks, or branch
protections; direct-default-branch commits; manual releases or package
publication outside the repository's existing merge-triggered automation;
access to or disclosure of secrets; destructive repository operations;
unrelated pull requests; or material scope expansion. Authorization to merge a
pull request includes any package version and publication performed
automatically by the repository's existing merge workflow. In this section,
`deploy` authorizes repository delivery; it authorizes a service or
infrastructure deployment only when the current request specifically identifies
that deployment. More-specific repository approval rules, including final
content or product publication, still apply. Cleanup is limited to the verified merged worktree and topic
branches described below; it never includes dirty worktrees or forced remote operations.

When requesting platform approval for an authorized step, quote the user's
delivery request and this shared instruction in the justification. If a
platform reviewer rejects the action, ask the user once and wait. Do not retry
an equivalent escalation or repeat the prompt during automatic continuations
unless the user provides new authorization or relevant context.

Before committing, run `git status --short`, stage intended files by exact
path, and verify the staged scope. For an explicitly approved default-branch
exception, state that the normal PR workflow is being bypassed and still check
scope. Include screenshots only for changes to rendered UI, generated visual
output, or external presentation.

## Merged-Branch Cleanup

After confirming the exact PR is merged, remove only its clean worktree.
Ordinary remote branch deletion requires the remote ref to match the PR's
recorded head. A local topic branch may be deleted with `git branch -D` only
when its tip matches that recorded head and either:

- Its tree matches the squash commit's tree; or
- When the base advanced, both the `git patch-id --verbatim` of the aggregate
  diff from the merge base matches the squash commit's first-parent diff and
  applying that exact aggregate diff to the first-parent tree produces the
  squash commit's tree.

The second proof handles intervening base changes without ignoring whitespace
or patch locations. Retain the branch if neither proof succeeds. This is not
authorization for `git branch -D` on any other local branch or for other
destructive operations.

## Review Gate

Before committing, use the installed `$branch-review-subagent-loop` skill to
review the complete branch diff. Follow the skill through any required fixes,
validation, and re-review. If the skill is unavailable, ask the user to install
it before continuing.

Create, update, or merge the pull request only after the review gate passes.
Merging also requires green checks unless the user explicitly accepts the
remaining risk.
