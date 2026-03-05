# Queue Migration Matrix

This maps legacy `openupm/pm2-build.yml` entries to new `openupm-next` services.

## Build Queue Entries

- `queue-pkg`
  - legacy: `app/queues/process.js pkg`
  - new: `apps/queue` command `node build/index.js process pkg`
  - npm script: `npm run start` (in `apps/queue`)

- `queue-rel`
  - legacy: `app/queues/process.js rel`
  - new: `apps/queue` command `node build/index.js process rel`
  - npm script: `npm run start:rel` (in `apps/queue`)

- `add-build-package-job`
  - legacy: `app/jobs/addBuildPackageJob.js --all`
  - new: `apps/queue` command `node build/index.js add-build-package-job --all`
  - npm script: `npm run start:add-build-package-job:all` (in `apps/queue`)

## Non-Build Operational Jobs

These move to `apps/jobs` and run by cron inside that service:

- `fetchPackageExtra`
- `aggregatePackageExtra`
- `updateRecentPackages`
- `fetchSiteInfo`
- `updateFeeds`
- `fetchBackerData`

## Deploy Model

- Legacy PM2 host-path deployment is replaced by Docker images for `apps/queue` and `apps/jobs`.
