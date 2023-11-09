---
---
# Opt-out From OpenUPM

OpenUPM respects the package owner's decision to opt-out from it, even though an open-source license always grants the right to publish/distribute code.

## Using Blocked Scopes

To block an entire scope (e.g., `com.mycompany`) from OpenUPM, add the package scope or the package name to the [data/blocked-scopes.yml](https://github.com/openupm/openupm/tree/master/data/blocked-scopes.yml) file, and submit a pull request (PR) with the reason. This blocking behavior takes effect during the CI stage, which means it will break any existing packages under the newly added blocked scope. Therefore, please make sure to remove the blocked package metadata YAML file along with the PR.

## Using the Private Field of the package.json

To opt-out from OpenUPM, the package owner can also add `"private": true"` to the package.json.

## Unpublishing a Package

Please refer to [Unpublishing a Package](./modifying-upm-package.md#unpublishing-a-package) for instructions on unpublishing a package.

## Repository Unavailable

If the repository is removed or turned private, OpenUPM won't be able to track further changes. However, the published content will remain available on the registry.
