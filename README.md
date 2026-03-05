# OpenUPM Next

Codebase for the OpenUPM website and supporting services.

## Monorepo Layout

### Apps

- `apps/docs`: VuePress static site
- `apps/web`: API web server
- `apps/jobs`: background jobs and CLI tasks
- `apps/queue`: build queue workers (`queue-pkg`, `queue-rel`, `add-build-package-job`)

### Packages

- `packages/vuepress-plugin-openupm`: internal VuePress plugin for the docs site
- `packages/@openupm/types`: shared TypeScript types
- `packages/@openupm/test`: shared property-test helpers
- `packages/@openupm/common`: shared code for Node and docs
- `packages/@openupm/server-common`: shared server-side code
- `packages/@openupm/local-data`: access to local OpenUPM metadata and repo data
- `packages/@openupm/ads`: ad backend logic
- `packages/@openupm/pkg-template`: template used by the package scaffold

### Tooling

Shared repo config lives in `tooling/`:

- `tooling/tsconfig`
- `tooling/eslint`
- `tooling/jest`
- `tooling/vitest`
- `tooling/scripts`

## Requirements

- Volta-managed Node: `22.19.0`
- npm: `10.9.3`

Install Volta:

```bash
curl https://get.volta.sh | bash
```

Install dependencies from the repo root:

```bash
npm install
```

## Common Commands

Run these from the repo root unless noted otherwise.

```bash
# Lint (explicitly)
npm run lint

# Build all workspaces
npm run build

# Run tests across the workspace
npm test

# Clean generated outputs
npm run clean

# Force a fresh uncached release build
npm run build:release -- --force
```

## Development Notes

- `npm run lint` is separate on purpose. `build` and `test` do not run lint implicitly.
- Root `npm test` runs workspace tests through Turbo and builds dependent packages first.
- The repo uses Vitest for tests.
- Shared configuration should usually be changed in `tooling/`, not copied into leaf packages.

## Package Scaffolding

Create a new Node package from the shared template:

```bash
npm run new:node-package -- packages/@openupm/my-package @openupm/my-package
```

## Local Services

Run the docs site:

```bash
cd apps/docs
npm run docs:dev
```

Run the API server:

```bash
cd apps/web
npm run start
```

Point the docs app at the local API server:

```bash
cd apps/docs
VITE_OPENUPM_API_SERVER_URL=http://localhost:3600 npm run docs:dev
```

## Local Data

Some packages and builds depend on OpenUPM metadata from the `openupm/openupm` repository.

CI provides this through `OPENUPM_DATA_PATH`. For local runs, set it manually when needed:

```bash
OPENUPM_DATA_PATH=/abs/path/to/openupm/data npm test
```

## Docs Build

The quickest full docs SSR smoke test is:

```bash
cd apps/docs
npm run docs:build:limit
```

The docs app includes Node 22 compatibility aliases in `apps/docs/docs/.vuepress/config.ts`. Keep those in place unless the VuePress / Vue I18n dependency stack is upgraded and revalidated.
