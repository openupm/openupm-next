---
pageClass: page-nuget
---
# NuGet Packages

## Introduction to the UnityNuGet Project

[NuGet](https://docs.microsoft.com/en-us/nuget/what-is-nuget) is the package manager for .NET, designed to enable developers to share fundamental reusable code. As you may know, Unity uses its own package manager format (UPM). Traditionally, to use a NuGet package in Unity, UPM packages include the NuGet package as embedded DLLs. This approach can become problematic when two packages include the same DLL or different versions of a NuGet package. A robust solution is to create a shared NuGet package in UPM format that other packages can depend on.

[Alexandre Mutel (xoofx)](xoofx) originally created the [UnityNuGet](https://github.com/xoofx/UnityNuGet) project, which is now maintained by [Borja Domínguez (bdovaz)](https://github.com/bdovaz). This service converts NuGet packages to UPM format. The UnityNuGet registry server handles the packaging of these NuGet packages in a consistent and automated way, using proper naming under the `org.nuget` scope.

OpenUPM hosts a UnityNuGet server at [https://unitynuget-registry.openupm.com](https://unitynuget-registry.openupm.com). The service tracks the latest Docker release version and automatically deploys updates when a new version is released.

If you wish to update the tracked NuGet packages, please follow the instructions in the [UnityNuGet documentation](https://github.com/xoofx/UnityNuGet).

## Using Uplinked UnityNuGet

::: warning Experiments
The UnityNuGet uplink is an experimental feature.
:::

To improve convenience, the OpenUPM registry [uplinks](https://verdaccio.org/docs/en/uplinks) to the UnityNuGet registry, making it transparent for Unity users to consume UnityNuGet packages.

- The OpenUPM registry synchronizes with the UnityNuGet registry on an hourly basis.
- Package tarballs are hosted on our CDN server, ensuring fast access.
- You can view package details via `https://package.openupm.com/org.nuget.some-package` or by using the openupm-cli command `openupm view org.nuget.some-package`.
- You can search `org.nuget` packages through the OpenUPM registry search endpoint, openupm-cli search, and the Unity Package Manager search interface.

The integration comes with a few limitations:

- NuGet packages have generated website pages based on the UnityNuGet curated package list, but they are not shown in the normal OpenUPM package list.
- Package page details and search results are served by the registry uplink and may depend on UnityNuGet availability and cache freshness. If UnityNuGet is temporarily unavailable, already cached package metadata and tarballs continue to resolve through OpenUPM, but new uncached package details and search results may be delayed until the uplink recovers.

To demonstrate the uplinks feature, we have created a staging package at [https://github.com/openupm/com.example.nuget-consumer](https://github.com/openupm/com.example.nuget-consumer) which includes:

- Installation of an OpenUPM package that depends on UnityNuGet.
- Resolution of potential assembly conflicts by disabling "Assembly Version Validation."

If you install a package via openupm-cli, the uplink is used by default— all packages under the `org.nuget` scope are resolved directly from the OpenUPM registry.

## Using UnityNuGet Directly

In general, we recommend using the uplink feature to take advantage of the CDN and openupm-cli. If you prefer to query UnityNuGet directly, you can add the UnityNuGet registry as a scoped registry in your `manifest.json`:

```json
{
  "scopedRegistries": [
    {
      "name": "Unity NuGet",
      "url": "https://unitynuget-registry.openupm.com",
      "scopes": [
        "org.nuget"
      ]
    },
    // ... (other scoped registries, for example the OpenUPM registry)
  ]
}
```

## List All UnityNuGet Packages

You can browse the curated list of UnityNuGet packages on the [UnityNuGet GitHub repository](https://github.com/xoofx/UnityNuGet/blob/master/registry.json).
