# @openupm/queue

Queue worker app for build queues.

## Commands

- `node build/index.js process pkg`
- `node build/index.js process rel`
- `node build/index.js add-build-package-job --all`
- `node build/index.js add-build-package-job com.example.package`

## Migration Status

- Queue core, `add-build-package-job`, `buildPackage`, and `buildRelease` are migrated to TypeScript.
- Build and test entry points are available through package scripts:
  - `npm run start` for `queue-pkg`
  - `npm run start:rel` for `queue-rel`
  - `npm run start:add-build-package-job:all` for periodic package scheduling

See `MIGRATION.md` for PM2-to-Docker command mapping.

## Auth Config

- Configure tokens via node-config files.
- Keep defaults as skeletons in `config/default.json5`.
- Mount runtime secrets as `config/local.json5` (gitignored), for example:
  - `github.tokens`: round-robin token array for GitHub access.
  - `azureDevops.token`: Azure DevOps PAT.
