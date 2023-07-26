---
layout: PackageAddLayout
showFooter: false
title: "Package Add"
editLink: false
---

# Submitting an Open Source UPM Package

::: tip Package criteria
Before submitting a GitHub-hosted UPM package, please ensure it meets our [package criteria](/docs/adding-upm-package#upm-package-criteria).
:::

Steps to submit a UPM package:

1. Fill the form below and click the <kbd>Submit metadata</kbd> button to upload the package metadata file to GitHub.
2. On the opened GitHub page, click the <kbd>Commit changes...</kbd> button to create a pull request. Keep the default commit message unchange as `Create ...yml`.
3. The pull request will be merged after passing a test workflow. For [security reasons](https://github.blog/2021-04-22-github-actions-update-helping-maintainers-combat-bad-actors/), a first-time contributor needs approval from a maintainer, which we aim to provide within 24h.
4. Once the PR is merged, it triggers another build workflow (up to 1h) to publish your package to the OpenUPM registry.
5. After completion, find your package at https://openupm.com/packages/your-package-name/. It will also appear on the [listing page](/packages?sort=time) if at least one version is published.
