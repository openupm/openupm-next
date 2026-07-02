---
title: "OpenUPM GitHub Action Publish Wait"
author: "Favo Yang"
date: "2026-06-14"
readingTime: "1 min read"
description: "OpenUPM now has an experimental GitHub Action that can trigger a package refresh from a tag or release workflow and wait until the version is published."
cover: "/images/blog-covers/openupm-github-action-publish-wait.png"
editLink: false
---
# OpenUPM GitHub Action Publish Wait

<BlogPostMeta />

OpenUPM now has an experimental GitHub Action for package authors who want their
release workflow to know when a tagged package version is available from the
registry.

The action uses GitHub Actions OIDC, so it does not require an OpenUPM account,
personal access token, or repository secret. A workflow sends the package name
and tag to OpenUPM, OpenUPM verifies that the workflow repository matches the
registered package repository, and the action waits until the package version is
published, fails, or reaches the workflow timeout.

This is meant for packages that are already registered on OpenUPM, or new
packages that are integrated with OpenUPM from the beginning. It is not a bulk
import tool for an existing repository with a large tag history.

The minimal example is
[`openupm/com.example.openupm-action`](https://github.com/openupm/com.example.openupm-action),
which demonstrates the tag-push workflow. For complete workflow examples,
inputs, outputs, rate limits, and GitHub Release guidance, read
[Publishing with GitHub Actions](/docs/github-action-publish).

Because this publishing path is still experimental, keep the workflow simple:
use parseable version tags, keep normal OpenUPM package metadata up to date,
and treat the action as a faster feedback loop around the existing OpenUPM
queue rather than a replacement for package registration.

<BlogPostNav />
