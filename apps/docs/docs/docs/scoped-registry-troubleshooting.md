---
title: Unity Scoped Registry Troubleshooting
description: Fix common Unity Package Manager scoped registry issues when using OpenUPM, openupm-cli, UnityNuGet packages, and private UPM registries.
---
# Unity Scoped Registry Troubleshooting

Use this guide when Unity does not show an OpenUPM package, cannot resolve a package from `https://package.openupm.com`, or installs a different package source than expected.

## Check the Registry Entry

Open `Packages/manifest.json` and verify that `scopedRegistries` contains the OpenUPM registry:

```json
{
  "scopedRegistries": [
    {
      "name": "package.openupm.com",
      "url": "https://package.openupm.com",
      "scopes": [
        "com.example.package"
      ]
    }
  ]
}
```

The `url` must be exactly `https://package.openupm.com` for public OpenUPM packages. The `scopes` list should include the package name or a safe parent namespace that only contains packages you intend to resolve through OpenUPM.

For a full setup walkthrough, see [Getting Started with Unity Editor](./getting-started.md). To let the CLI edit the manifest for you, use [Getting Started with openupm-cli](./getting-started-cli.md).

## Match the Package Name and Scope

Unity chooses a scoped registry by matching the package name prefix against the registry's scopes. If the package is `com.cysharp.unitask`, then `com.cysharp.unitask` is the most precise scope. A broader scope such as `com.cysharp` can work, but it may route other packages under the same namespace to OpenUPM too.

If Unity shows "No packages found" or the package never appears in the Package Manager window:

- Confirm the package page exists on OpenUPM, for example [UniTask](/packages/com.cysharp.unitask/).
- Confirm the package name in `dependencies` exactly matches the OpenUPM package name.
- Remove accidental whitespace or trailing slashes from the registry URL.
- Restart Unity after editing `Packages/manifest.json` outside the editor.

## Resolve Cached or Locked Versions

Unity may keep an older resolved version in `Packages/packages-lock.json`. If the manifest is correct but Unity still resolves an old package, close Unity and inspect the lock file entry for that package. In many projects, deleting the single stale lock-file entry and reopening Unity is enough for the Package Manager to resolve again.

For package build failures after OpenUPM accepts a package, see [Troubleshooting Build Errors](./troubleshooting-build-errors.md).

## UnityNuGet Packages

UnityNuGet packages use the `org.nuget` scope and are available through OpenUPM's registry uplink. For example, Newtonsoft.Json is available as [org.nuget.newtonsoft.json](/packages/org.nuget.newtonsoft.json/).

If a UnityNuGet package is missing from normal topic browsing, search for the `org.nuget` package name or visit the generated package page directly. UnityNuGet packages are searchable and installable, but they are listed separately from the normal OpenUPM package grid. See [NuGet Packages](/nuget/) for details.

## Private Registries

Private UPM registries use the same scoped registry mechanism as OpenUPM. Use a separate `scopedRegistries` entry for your private registry and choose private scopes that do not overlap with OpenUPM packages unless you intentionally want the private registry to win.

For a complete private registry walkthrough, see [Host Your Private Unity Scoped Registry in Just 15 Minutes](./host-private-upm-registry-15-minutes.md).
