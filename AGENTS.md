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

## Working Rules

- Run `npm run lint` explicitly. `build` and `test` do not run lint for you.
- Root `npm test` runs `turbo run test`, and Turbo runs each package `build` before `test`.
- If you need a clean rebuild, use `npm run build:release -- --force` or `npm test -- --force`.
- Prefer changing shared config in `tooling/` rather than duplicating per-package config.

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
  and `package-requeue`; validate them with focused tests before deploy.
- Do not put private production hostnames, paths, or sudo wrapper details in
  this public application repo. Production invocation belongs in
  `openupm-devops`.

## Docs App Notes

- Docs commands run from `apps/docs`.
- `npm run docs:build:limit` is the fastest full SSR build smoke test for the docs app.
- The docs VuePress config contains Node 22 compatibility aliases for:
  - `date-fns/locale`
  - `@intlify/shared`
- Do not remove those aliases unless the upstream VuePress / Vue I18n dependency stack is upgraded and revalidated.

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
- If local Redis is not already running, use the same Redis Stack image version
  defined for live deployment in `openupm-devops`:
  `docker run -d --name openupm-next-test-redis -p 6379:6379 redis/redis-stack-server:7.2.0-v10`.
  Remove it after testing with
  `docker rm -f openupm-next-test-redis`.

## Scaffolding

- Create a new Node package with:
  - `npm run new:node-package -- packages/@openupm/my-package @openupm/my-package`
