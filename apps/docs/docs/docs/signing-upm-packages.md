---
---
# Signing UPM Packages

Unity 6.3 introduced package signature verification for Unity Package Manager
packages. OpenUPM supports signed packages by consuming signed tarballs that
package authors build and attach to GitHub Releases.

The main benefit is that the developer can sign the package directly. Trust no
longer has to be centered on the package registry that republishes the package.
For Unity Editor users, a signed package can also remove the unsigned package
warning from the Package Manager UI.

OpenUPM does not sign packages on behalf of package authors. The package author
owns the Unity organization, service account, build process, and release asset.
OpenUPM's role is to discover the version tag, download the matching public
GitHub Release asset, and publish that tarball unchanged.

Use this workflow when your package needs any of these release-time steps:

- signing the package with Unity's UPM CLI
- building generated files, DLLs, or native binaries before publishing
- publishing package content that should not be committed to a UPM branch
- keeping a pull-based OpenUPM release flow without giving OpenUPM credentials
  or custom build logic

## How It Works

The signed package is created in your own CI workflow. For each version tag, the
workflow builds a UPM `.tgz` package, signs it with Unity service account
credentials, creates a GitHub Release for the same tag, and uploads the signed
tarball as a release asset.

OpenUPM then uses `trackingMode: githubRelease` in the package metadata. Instead
of cloning the tag and running `npm pack`, OpenUPM downloads the `.tgz` or
`.tar.gz` asset from the GitHub Release whose tag name exactly matches the
version tag.

Signed Unity packages contain `package/.attestation.p7m` inside the tarball.
OpenUPM can show the package as signed when the published release asset contains
that signing attestation.

## Unity's Signing Model

Unity's current signing implementation uses a Unity service account and the UPM
CLI. The CLI is lightweight enough to run in GitHub Actions, but the actual
signing is backed by Unity. Unity owns the certificate and private keys, while
the package author authenticates with service account credentials and chooses
which package tarball to sign.

This model is convenient for package authors because they do not have to manage,
store, rotate, or protect their own signing certificate and private key. It also
lets Unity keep some control over the signing ecosystem while still allowing
package developers to sign releases from their own CI.

## Requirements

- a public GitHub repository that meets the normal OpenUPM package criteria
- Unity UPM CLI available in CI
- a Unity service account with package signing permission for the Unity
  organization that should sign the package
- GitHub Actions secrets for the Unity service account
- a GitHub Release asset ending in `.tgz` or `.tar.gz` for every published tag

Use these GitHub Actions secrets for the signing credentials:

```text
UPM_SERVICE_ACCOUNT_KEY_ID
UPM_SERVICE_ACCOUNT_KEY_SECRET
UPM_ORG_ID
```

Repository secrets are enough for one package. For several repositories that
sign packages for the same Unity organization, GitHub organization secrets
scoped to only those repositories are easier to rotate.

## GitHub Actions Flow

The release workflow should run only for version tags:

```bash
git tag 1.0.0
git push origin main 1.0.0
```

For each tag, the workflow should:

1. check out the repository
2. install Unity UPM CLI
3. run `upm pack ./package` or the equivalent package folder
4. verify that the tarball contains `package/package.json`
5. verify that the tarball contains `package/.attestation.p7m`
6. create a GitHub Release whose tag is the same version tag
7. upload the signed package tarball as a release asset

Upload the signed package as a GitHub Release asset, not only as a GitHub
Actions workflow artifact. Workflow artifacts and logs expire after their
retention period. Release assets stay attached to the release until the asset or
release is deleted, so OpenUPM can process older versions later.

The [Signed UPM Example](https://github.com/openupm/com.example.signed-upm)
repository is a minimal reference implementation. Its
[README](https://github.com/openupm/com.example.signed-upm/blob/main/README.md)
documents the current workflow and credential names.

## OpenUPM Metadata

Set the package metadata to use GitHub Release asset tracking:

```yaml
trackingMode: githubRelease
```

When a release has only one publishable `.tgz` or `.tar.gz` asset, OpenUPM
selects it automatically. If a release has multiple assets, add
`githubReleaseAssetName`:

```yaml
trackingMode: githubRelease
githubReleaseAssetName: 'com.example.package-'
```

`githubReleaseAssetName` can be either the exact asset filename or a stable
filename prefix. The prefix should never contain a version number; otherwise the
package metadata would need to change for every release. GitHub Release asset
names are filenames only; do not include a directory path such as `dist/`.
OpenUPM still discovers versions from Git tags in this mode. Normal build
failures are retried up to three times. If the GitHub Release exists but the
publishable asset is not attached yet, OpenUPM checks again every 6 hours for up
to 7 days from the first missing-asset failure. After 7 days, attach the asset
and request a rebuild.

Signed release tarballs are often built from a package folder and may contain
only the package payload plus the signing attestation. The README does not have
to be inside the tarball for the package itself to be signed and published.

## Migrating Existing Packages

Because Unity introduced package signing in Unity 6.3, existing OpenUPM packages
are not expected to have signed historical versions. A good migration path is to
add signing for the next package version you release, then keep future releases
signed from that point onward.

For an existing OpenUPM package, submit and merge the package metadata change
that switches `trackingMode` from `git` to `githubRelease` before you publish a
new signed version tag. Wait until that pull request is merged, then bump the
package version and push the tag. This avoids a race where the current Git
tracker detects the new version first and publishes a package packed from the
Git checkout instead of the signed GitHub Release asset.

## Limitations

Package signing improves package provenance, but it is not a malware scanner and
it does not prove that the package source code is safe. The npm and JavaScript
ecosystem has shown that a central registry's trust model is not the only risk:
malicious code can still be introduced in source, build scripts, dependencies,
or generated files before a package is signed.

GitHub Release asset tracking also means the shipped package tarball may not be
identical to the repository source at the tag. A package author may build a DLL,
generate files, strip development-only files, or otherwise transform the source
before uploading the final tarball. This is the same kind of release model used
by many npm packages: the source repository is important, but the published
artifact is the package that users actually install.

Treat signing as one layer of trust. Review the package source, release
workflow, dependencies, and published tarball when your project has higher
security requirements.

## Choosing Between Git Tags And Release Assets

Use the default `trackingMode: git` when OpenUPM can pack the package directly
from the tagged Git checkout.

Use `trackingMode: githubRelease` when the published package must be produced by
your own release workflow. This keeps signing credentials and custom build steps
in your repository while still letting OpenUPM publish the final UPM package.
