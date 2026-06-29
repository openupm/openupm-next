# @openupm/jobs

The Node.js app for OpenUPM background jobs.

## Production

Production runs this app as the `jobs` service in the Docker Compose deployment.

Scheduled jobs are controlled by the `jobs.*.enabled` flags in runtime config.
Healthchecks ping URLs are also runtime config values, not committed defaults.

## Auth Config

- Configure tokens via node-config files.
- Keep defaults as skeletons in `config/default.json5`.
- Mount runtime secrets as `config/local.json5` (gitignored), for example:
  - `github.tokens`: round-robin token array for GitHub API calls.

## One-Shot Maintenance

- Recompute package extra data for every package, including README HTML:
  `node build/index.js fetch-package-extra --all --force`
- Recompute selected packages only:
  `node build/index.js fetch-package-extra com.example.package --force`
