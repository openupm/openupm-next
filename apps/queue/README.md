# @openupm/queue

Queue worker app for build queues.

## Commands

- `node build/index.js process pkg`
- `node build/index.js process rel`
- `node build/index.js add-build-package-job --all`
- `node build/index.js add-build-package-job com.example.package`
- `node build/index.js schedule add-build-package-job`

## Production Entry Points

- `queue-pkg`: `npm run start`
- `queue-rel`: `npm run start:rel`
- `queue-add-build-package-job`: `npm run start:add-build-package-job:all`

Production Docker Compose wiring and runtime config are managed outside this
application repository.

See `MIGRATION.md` for the historical PM2-to-Docker command mapping.

## Auth Config

- Configure tokens via node-config files.
- Keep defaults as skeletons in `config/default.json5`.
- Mount runtime secrets as `config/local.json5` (gitignored), for example:
  - `github.tokens`: round-robin token array for GitHub access.
  - `azureDevops.token`: Azure DevOps PAT.
