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
- Local runs may need:
  - `OPENUPM_DATA_PATH=/abs/path/to/openupm/data`

## Scaffolding

- Create a new Node package with:
  - `npm run new:node-package -- packages/@openupm/my-package @openupm/my-package`
