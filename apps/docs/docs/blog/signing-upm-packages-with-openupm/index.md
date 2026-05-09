---
title: "Signing UPM Packages with OpenUPM"
author: "Favo Yang"
date: "2026-05-08"
readingTime: "3 min read"
description: "Unity 6.3 package signing lets package authors ship signed tarballs through GitHub Releases while OpenUPM republishes the exact artifact."
editLink: false
---
# Signing UPM Packages with OpenUPM

<BlogPostMeta />

Unity 6.3 introduced package signature verification for Unity Package Manager
packages. For package authors and Unity developers, this is an important step
toward clearer package provenance: the package can now be signed by the
developer who builds it, instead of relying entirely on the registry that
republishes it.

OpenUPM supports this model by publishing signed package tarballs that package
authors build and attach to GitHub Releases.

## Why This Matters

Traditionally, OpenUPM discovers a package version from a Git tag, clones the
repository, and packs the package for publishing. That works well for many
packages, but it is not enough when the package needs release-time work such as
signing, generating files, compiling DLLs, or including native binaries.

With signed packages, the package author owns the full release process. They
build the `.tgz`, sign it with Unity's UPM CLI, and upload the final artifact
to GitHub Releases. OpenUPM then downloads and republishes that exact tarball
unchanged.

This keeps trust closer to the package author. It also allows signed packages
to avoid unsigned package warnings in the Unity Package Manager UI.

## How The Workflow Works

The package author creates a CI workflow, usually with GitHub Actions. For
every version tag, the workflow should:

1. Check out the repository.
2. Install Unity's UPM CLI.
3. Run `upm pack` for the package folder.
4. Sign the package using Unity service account credentials.
5. Verify the tarball includes `package/package.json`.
6. Verify the tarball includes `package/.attestation.p7m`.
7. Create a GitHub Release for the same tag.
8. Upload the signed `.tgz` or `.tar.gz` file as a release asset.

The release asset is important. GitHub Actions artifacts and logs expire, but
GitHub Release assets remain attached to the release unless deleted. That gives
OpenUPM a stable artifact to publish, including when older versions need to be
processed later.

## OpenUPM Configuration

To use GitHub Release assets instead of packing directly from Git, package
metadata should use:

```yaml
trackingMode: githubRelease
```

If a release contains only one publishable `.tgz` or `.tar.gz` asset, OpenUPM
can select it automatically.

If there are multiple assets, the package can specify an exact filename or
stable prefix:

```yaml
trackingMode: githubRelease
githubReleaseAssetName: 'com.example.package-'
```

The prefix should not include a version number, otherwise the metadata would
need to change for every release. The asset name is a filename only, not a path
inside the repository or CI workspace.

## Migrating Existing Packages

Since Unity introduced package signature verification in Unity 6.3, existing
packages are not expected to have signed historical versions. The practical path
is to start signing the next version you release.

For packages that are already listed on OpenUPM, change the metadata to
`trackingMode: githubRelease` first and wait until that pull request is merged.
Only then bump the package version and push the new tag. This avoids a race
where the existing Git tracker sees the new version first and publishes a
tarball packed from the Git checkout instead of the signed GitHub Release asset.

## Example Repository

OpenUPM provides a minimal signed package example at:

```text
https://github.com/openupm/com.example.signed-upm
```

Package authors can use that repository to learn the details of the workflow,
including the package layout, GitHub Actions release process, Unity service
account secret names, and GitHub Release asset setup.

## What Signing Does And Does Not Prove

Package signing improves provenance, but it is not a malware scanner. It does
not prove that the source code, generated files, build scripts, or dependencies
are safe.

It proves that the signed artifact came through the author's signing workflow.
For higher-security projects, teams should still review the source,
dependencies, release workflow, and final published tarball.

## When To Use This

Use the default Git tag tracking when OpenUPM can safely pack the package
directly from the tagged repository.

Use GitHub Release asset tracking when the final package must be produced by
your own release workflow. This is the right choice for signed packages,
generated builds, DLLs, native binaries, or any package that should be
published as a prepared artifact rather than a raw Git checkout.

OpenUPM's role remains simple: discover the version, fetch the matching release
asset, and publish the tarball unchanged. The author keeps control of signing
credentials, build logic, and the final package content.

For the complete guide, read [Signing UPM Packages](/docs/signing-upm-packages).

<BlogPostNav />
