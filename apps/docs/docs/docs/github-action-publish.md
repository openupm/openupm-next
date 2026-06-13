---
---

# Publishing with GitHub Actions

OpenUPM can publish a package version automatically after you push a Git tag or
publish a GitHub Release. The official GitHub Action triggers an OpenUPM
package scan and waits until the matching version is published, fails, or
reaches the workflow timeout.

Use this when you maintain the package repository and want the tag workflow to
report whether the OpenUPM registry has accepted the new package version. This
does not replace the normal OpenUPM package submission process: the package must
already be registered on OpenUPM, and the registered `repoUrl` must point to the
same public GitHub repository that runs the workflow.

## What the Action Does

The action performs three steps:

1. Request a short-lived GitHub Actions OIDC token from GitHub.
2. Send the package name, version, and optional Git tag to OpenUPM.
3. Poll OpenUPM until the version is installable from the registry, fails, or
   reaches the configured timeout.

You do not need an OpenUPM account, an OpenUPM token, a GitHub personal access
token, or a shared webhook secret. OpenUPM verifies the GitHub OIDC token and
checks that the workflow repository matches the package `repoUrl`.

## Tag Push Workflow

For a package that uses plain semver tags such as `1.2.3`, add this workflow to
the package repository:

```yaml
name: OpenUPM

on:
  push:
    tags:
      - '*'

permissions:
  id-token: write
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: openupm/openupm-action@v1
        with:
          package: com.example.openupm-action
          version: ${{ github.ref_name }}
          tag: ${{ github.ref_name }}
```

The `id-token: write` permission lets the action request a GitHub OIDC token.
The token is scoped to the workflow run and expires quickly.

## GitHub Release Workflow

You can also trigger OpenUPM after a GitHub Release is published. This example
accepts release tags such as `v1.2.3` and passes `1.2.3` as the OpenUPM package
version:

```yaml
name: OpenUPM

on:
  release:
    types: [published]

permissions:
  id-token: write
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - id: version
        env:
          TAG_NAME: ${{ github.event.release.tag_name }}
        run: echo "value=${TAG_NAME#v}" >> "$GITHUB_OUTPUT"

      - uses: openupm/openupm-action@v1
        with:
          package: com.example.openupm-action
          version: ${{ steps.version.outputs.value }}
          tag: ${{ github.event.release.tag_name }}
```

If your release tags already match `package.json.version`, use the tag value
directly for both `version` and `tag`.

## Prefixed Tags

If your repository uses prefixed package tags, pass the OpenUPM package version
separately from the Git tag. For example, a tag named `upm/1.2.3` should use:

```yaml
- uses: openupm/openupm-action@v1
  with:
    package: com.example.package
    version: 1.2.3
    tag: upm/1.2.3
```

The `tag` input must match the GitHub workflow ref. The `version` input must
match the `version` field in the package's `package.json` at that tag.

## Inputs

| Input                   | Required | Default                   | Description |
| ----------------------- | -------- | ------------------------- | ----------- |
| `package`               | Yes      |                           | OpenUPM package name, such as `com.company.tool`. |
| `version`               | Yes      |                           | Package version to wait for, such as `1.2.3`. |
| `tag`                   | No       |                           | Git tag that triggered the workflow. Recommended for tag-push workflows. |
| `timeout-minutes`       | No       | `15`                      | Maximum time to wait before failing the workflow. |
| `poll-interval-seconds` | No       | `15`                      | Delay between status checks. |
| `api-url`               | No       | `https://api.openupm.com` | OpenUPM API URL. |
| `oidc-audience`         | No       | `openupm`                 | OIDC audience requested from GitHub and verified by OpenUPM. |

## Outputs

| Output              | Description |
| ------------------- | ----------- |
| `state`             | Final OpenUPM release state, such as `succeeded` or `failed`. |
| `reason`            | Public failure reason when OpenUPM reports one. |
| `published-version` | Registry version reported by OpenUPM when available. |
| `signed`            | Whether OpenUPM reports the package version as signed. |
| `package-url`       | OpenUPM package page URL. |
| `status-url`        | OpenUPM release status API URL. |

## Failure Behavior

The workflow fails when OpenUPM rejects the trigger request, the package version
fails to build, or the timeout is reached before the version becomes
installable.

A successful action run means the requested version is available from the
OpenUPM registry. The package detail page and website search may update through
their own refresh cycle after the registry publish completes.

If the action reports a build failure, use the package page's build history and
the [Troubleshooting Build Errors](./troubleshooting-build-errors.md) guide to
fix the package, then create a new version tag or re-tag a failed version when
your repository policy allows it.

## Example Repository

The [`openupm/com.example.openupm-action`](https://github.com/openupm/com.example.openupm-action)
repository demonstrates a minimal Unity package that publishes through the
[`openupm/openupm-action`](https://github.com/openupm/openupm-action) workflow.
