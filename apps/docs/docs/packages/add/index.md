---
layout: PackageAddLayout
title: "Package Add"
editLink: false
showContentTopAd: false
---

# Submitting an Open Source UPM Package

::: tip Package Criteria
Before submitting a GitHub-hosted UPM package, please ensure it meets our [package criteria](/docs/adding-upm-package#upm-package-criteria).
:::

To submit a UPM package, follow these steps:

1. Fill out the form below and click the <kbd>Submit metadata</kbd> button to upload the package metadata file to GitHub.

2. On the opened GitHub page, click the <kbd>Commit changes...</kbd> button to create a pull request. Keep the default commit message unchanged as `Create ...yml`.

3. The pull request will be merged after passing a test workflow. For [security reasons](https://github.blog/2021-04-22-github-actions-update-helping-maintainers-combat-bad-actors/), new GitHub user needs approval from a maintainer, and we aim to provide this within 24 hours.

4. Once the PR is merged, it triggers another build workflow (in average 15~30 minutes) to publish your package to the OpenUPM registry.

5. After completion, you can find your package at https://openupm.com/packages/your-package-name/. It will also appear on the [listing page](/packages?sort=time) if at least one version gets published.