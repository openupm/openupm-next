# OpenUPM Next

- [OpenUPM Next](#openupm-next)
  - [Layout](#layout)
  - [Install](#install)
  - [Usage](#usage)

Codebase for OpenUPM website and services.

## Layout

`apps/`
| Package Name | Description     |
| ------------ | --------------- |
| `docs`       | OpenUPM website |

`packages/` - ecosystem packages

| Package Name              | Description                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `vuepress-plugin-openupm` | Internal VuePress plugin for the OpenUPM website.                                                                                 |
| `@openupm/types`          | TypeScript type definitions.                                                                                                      |
| `@openupm/test`           | Test arbitraries for Fast-check.                                                                                                  |
| `@openupm/common`         | Shared code for Node.js and VuePress.                                                                                             |
| `@openupm/local-data`     | Handles [local data](https://github.com/openupm/openupm/tree/master/data) such as package metadata YAML files, topics, backers... |

## Install

Install volta to manage node version:

```
curl https://get.volta.sh | bash
```

Then install dependencies:

```
npm install
```

## Usage

```
# Lint
npm run lint

# Test
npm run test

# Build
npm run build

# Build release
npm run build:release
```