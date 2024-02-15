# OpenUPM Next

- [OpenUPM Next](#openupm-next)
  - [Layout](#layout)
  - [Install](#install)
  - [Development](#development)

Codebase for OpenUPM website and services.

## Layout

`apps/`
| Package Name | Description     |
| ------------ | --------------- |
| `docs`       | OpenUPM website |
| `web`        | API web server  |
| `job`        | cron job server |

`packages/` - ecosystem packages

| Package Name              | Description                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `vuepress-plugin-openupm` | Internal VuePress plugin for the OpenUPM website.                                                                                 |
| `@openupm/types`          | TypeScript type definitions.                                                                                                      |
| `@openupm/test`           | Test arbitraries for Fast-check.                                                                                                  |
| `@openupm/common`         | Shared code for Node.js and VuePress.                                                                                             |
| `@openupm/server-common`  | Shared code for Node.js server.                                                                                                   |
| `@openupm/local-data`     | Handles [local data](https://github.com/openupm/openupm/tree/master/data) such as package metadata YAML files, topics, backers... |
| `@openupm/ads`            | ad backend                                                                                                                        |
| `pkg-template`            | Package template for @openupm/apps                                                                                                |

## Install

Install volta to manage node version:

```
curl https://get.volta.sh | bash
```

Then install dependencies:

```
npm install
```

## Development

Build and test:
```
# Build
npm run build

# Test
npm run test
```

Run the docs website:
```
cd apps/docs
npm run docs:dev
```

Test the local web API server:
```
cd apps/web
npm run start

cd apps/docs
VITE_OPENUPM_API_SERVER_URL=http://localhost:3600 npm run docs:dev
```
