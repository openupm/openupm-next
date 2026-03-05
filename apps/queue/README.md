# @openupm/queue

Queue worker app for build queues.

## Commands

- `node build/index.js process pkg`
- `node build/index.js process rel`
- `node build/index.js add-build-package-job --all`
- `node build/index.js add-build-package-job com.example.package`

## Migration Status

- Queue core and add-build-package-job are migrated to TypeScript.
- `buildPackage` and `buildRelease` worker internals are intentionally fail-fast placeholders and must be migrated before production use.
