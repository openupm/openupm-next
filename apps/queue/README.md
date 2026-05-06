# @openupm/queue

Queue worker app for build queues.

## Commands

- `node build/index.js process pkg`
- `node build/index.js process rel`
- `node build/index.js add-build-package-job --all`
- `node build/index.js add-build-package-job com.example.package`
- `node build/index.js schedule add-build-package-job`
- `node build/index.js health [queue...]`
- `node build/index.js queue-cli --help`

## Queue Operator CLI

`queue-cli` is the maintained replacement for legacy ad-hoc npm/job scripts
used to inspect and repair BullMQ package and release queues.

Run it locally from this package after building:

```bash
npm -w @openupm/queue run build
npm -w @openupm/queue run queue-cli -- --help
```

Every command supports `--help`; use that as the source of truth for arguments
and examples:

```bash
npm -w @openupm/queue run queue-cli -- queue-jobs --help
npm -w @openupm/queue run queue-cli -- releases-failed --help
```

Common commands:

- `queue-status [queue] [--json]`: show BullMQ counts and workers.
- `queue-jobs <queue> [state...] [--limit n] [--json]`: list queue jobs. If
  `--limit` is omitted, all matching jobs are returned.
- `remove-job <queue> <jobId> [--json]`: remove one BullMQ job by ID. This is
  destructive and does not remove package or release Redis records.
- `releases-failed [reason|unknown|timeout] [--limit n] [--json]`: list failed
  release records from Redis.
- `release-show <package> <version> [--json]`: show one release record.
- `release-remove <package> <version> [--json]`: delete one release record and
  remove its deterministic release queue job. This is destructive.
- `release-requeue <package> <version> [--json]`: reset one release and enqueue
  a fresh release build job.
- `package-requeue <package> [--json]`: remove the deterministic package queue
  job and enqueue a fresh package scan.

## Production Entry Points

- `queue-pkg`: `npm run start`
- `queue-rel`: `npm run start:rel`
- `queue-add-build-package-job`: `npm run start:add-build-package-job:all`
- `health`: `node build/index.js health [queue...]`
- `queue-cli`: `node build/index.js queue-cli`

Production Docker Compose wiring and runtime config are managed outside this
application repository.

The `health` command performs read-only BullMQ/Redis checks for one or more
queues. If no queue is provided, it checks both `pkg` and `rel`.

See `MIGRATION.md` for the historical PM2-to-Docker command mapping.

## Auth Config

- Configure tokens via node-config files.
- Keep defaults as skeletons in `config/default.json5`.
- Mount runtime secrets as `config/local.json5` (gitignored), for example:
  - `github.tokens`: round-robin token array for GitHub access.
  - `azureDevops.token`: Azure DevOps PAT.
