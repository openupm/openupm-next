---
title: "How to Maintain UPM Package Part 4: Managing Package Release with CLI"
author: "Favo Yang"
date: "2020-05-31"
readingTime: "3 min read"
originalUrl: "https://medium.com/openupm/how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163"
description: "The fourth package maintenance article covers release-it as a CLI-driven alternative for authors who prefer controlled releases."
editLink: false
---
# How to Maintain UPM Package Part 4: Managing Package Release with CLI

<BlogPostMeta />

This article is part of a series that discusses best practices of managing a UPM repository on GitHub. See [part 1](/blog/how-to-maintain-upm-package-part-1-7b4daf88d4c4/), [part 2](/blog/how-to-maintain-upm-package-part-2-f352fbf5f87c/), and [part 3](/blog/how-to-maintain-upm-package-part-3-2d08294269ad/).

In [previous posts](/blog/how-to-maintain-upm-package-part-2-f352fbf5f87c/), we introduced an automatic release process powered by semantic-release and GitHub Actions. That setup publishes from every commit to the master branch, which is not suitable for everyone. Some developers prefer to choose versions manually for marketing or release planning reasons. [Release-it](https://github.com/release-it/release-it) is a generic CLI tool for versioning and package publishing tasks.

![Image 6](./images/how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163-01-image-6.png)

Demo for release-it tool

## Get Started

Step 1, obtain a [personal access token](https://github.com/settings/tokens) (release-it only needs “repo” access; no “admin” or other scopes). You can optionally [add it to the environment](https://github.com/release-it/release-it/blob/master/docs/environment-variables.md) to simplify the command, or you need to provide it before each CLI execution.


Step 2, install the release-it CLI globally via NPM.

```bash
npm install release-it -g
```
By default, release-it is interactive and allows you to confirm each task before execution. You can play with the `dry-run` option.

```bash
GITHUB_TOKEN=YOUR_TOKEN_HERE release-it --dry-run

# Add --no-git.requireCleanWorkingDir if you're playing with the configuration file locally.
release-it --dry-run --no-git.requireCleanWorkingDir
```

![Image 7](./images/how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163-02-image-7.png)

Interactive mode

Step 3, add `.release-it.yml` as below with an empty `CHANGELOG.md`, then commit to the Git repository.

It tells release-it to

*   Generate changelog and save to `CHANGELOG.md`.
*   Create a GitHub Release.
*   Disable NPM if you want to submit to OpenUPM later.

Step 4, release-it!

```text
$ GITHUB_TOKEN=YOUR_TOKEN_HERE release-it
🚀 Let's release release-it-upm (currently at 0.0.0)
Empty changelog? Select increment (next version): major (1.0.0)
√ npx auto-changelog -p
Changeset:
M CHANGELOG.md
? Commit (chore: release v1.0.0)? Yes
? Tag (1.0.0)? Yes
? Push? Yes
? Create a release on GitHub (Release 1.0.0)? Yes
🚀 https://github.com/favoyang/release-it-upm/releases/tag/1.0.0
🚀 Done (in 55s.)
```
You can avoid the interactive mode, by specifying a version (major, minor, or patch) and passing the `--ci` option.

```text
$ GITHUB_TOKEN=YOUR_TOKEN_HERE release-it minor --ci
🚀 Let's release release-it-upm (1.0.0...1.1.0)

Changelog:
- dummy feature 001 b24e5e6

√ npx auto-changelog -p
Changeset:
M CHANGELOG.md
√ Git commit
√ Git tag
√ Git push
√ GitHub create release
🚀 https://github.com/favoyang/release-it-upm/releases/tag/1.1.0
🚀 Done (in 30s.)
```
## Further reading

To customize release-it to your own case, please check out [hooks](https://github.com/release-it/release-it#hooks) and [plugins](https://github.com/release-it/release-it#plugins). E.g. you can use the `after:release` hook to split a UPM branch, generate DLLs, and create a `upm/` prefixed Git tag.

[Reese Schultz](https://github.com/reeseschultz) is also working on an alternative tool called [ubump](https://github.com/reeseschultz/ubump), a CLI designed specifically for releasing UPM packages and more friendly for monorepo. The project is young and lacking features like generating a changelog, but still looks promising. We will revisit it when it gets mature.

## Conclusions

This tutorial shows how to manage package release with CLI. Please check out the example project: [favoyang/release-it-upm](https://github.com/favoyang/release-it-upm).


<BlogPostNav />
