# Queue Migration Reference

This records how the legacy `openupm/pm2-build.yml` build entries map to the
current Dockerized `openupm-next` queue services.

The migration is complete. Production deployment and runtime config are managed
outside this application repository.

## Build Queue Entries

- `queue-pkg`
  - legacy: `app/queues/process.js pkg`
  - new: `apps/queue` command `node build/index.js process pkg`
  - production service: `queue-pkg`
  - npm script: `npm run start` (in `apps/queue`)

- `queue-rel`
  - legacy: `app/queues/process.js rel`
  - new: `apps/queue` command `node build/index.js process rel`
  - production service: `queue-rel`
  - npm script: `npm run start:rel` (in `apps/queue`)

- `add-build-package-job`
  - legacy: `app/jobs/addBuildPackageJob.js --all`
  - new: `apps/queue` command `node build/index.js add-build-package-job --all`
  - new scheduler: `apps/queue` command `node build/index.js schedule add-build-package-job`
  - production service: `queue-add-build-package-job`
  - npm script: `npm run start:add-build-package-job:all` (in `apps/queue`)

## Non-Build Operational Jobs

These run from `apps/jobs` by the scheduler inside the production `jobs` service:

- `fetchPackageExtra`
- `aggregatePackageExtra`
- `updateRecentPackages`
- `fetchSiteInfo`
- `updateFeeds`
- `fetchBackerData`

## Deploy Model

- Legacy PM2 host-path deployment is replaced by Docker images for `apps/queue` and `apps/jobs`.
- The production data checkout is mounted into the queue services by the
  deployment layer.
