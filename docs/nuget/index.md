---
pageClass: page-nuget
---
# NuGet Packages

::: warning Experiments
The UnityNuGet uplink is an experimental feature.
:::

[NuGet](https://docs.microsoft.com/en-us/nuget/what-is-nuget) is the package manager for .NET, designed to enable developers to share fundamental reusable code. Many UPM packages use NuGet packages as embedded DLLs. This practice can become troublesome when two packages include the same DLL or different versions of one NuGet package. The solution is to create a shared NuGet package that everyone can depend on.

Thanks to xoofx's [UnityNuGet](https://github.com/xoofx/UnityNuGet), which is a project that provides a service to bundle NuGet packages into the UPM format. Similar to OpenUPM, UnityNuGet maintains a [curated list](https://github.com/xoofx/UnityNuGet/blob/master/registry.json) of NuGet packages. All packages listed there should be available on a registry at [https://unitynuget-registry.azurewebsites.net](https://unitynuget-registry.azurewebsites.net). The NuGet Registry takes care of packaging up these NuGet packages in a consistent, automated way, using proper package naming under the `org.nuget` scope.

The OpenUPM registry [uplinks](https://verdaccio.org/docs/en/uplinks) to the UnityNuGet registry to make it easier to use a NuGet package.

- OpenUPM registry syncs with the UnityNuGet registry hourly.
- Cached tarballs are hosted on CDN as well.
- You can view package details via openupm-cli `openupm view org.nuget.some-package`.

The integration comes with a few limitations.

- NuGet packages are not searchable or browsable on the OpenUPM website.
- Searching for NuGet packages via the OpenUPM registry's search endpoint will result in "404 packages not found". This affects both openupm-cli's search command and Unity Package Manager's search feature. As a side-effect of this issue,
  - NuGet packages will be invisible in Unity Package Manager's "My Registries" section, but still visible in the "In Project" section.
  - Unity console will warn "Error searching for packages" the first time you open the Package Manager.
  - The search issue may be resolved with improved search endpoint behavior in the future.

## Using Uplinked UnityNuGet

See the demo project at [https://github.com/favoyang/com.example.nuget-consumer](https://github.com/favoyang/com.example.nuget-consumer) that includes:

- Installing an OpenUPM package that depends on UnityNuGet.
- Solving potential assembly conflicts by disabling "Assembly Version Validation".

## Using UnityNuGet Directly

To use UnityNuGet directly in your Unity project, you need to add it to your scoped registries with the appropriate scopes. Follow these steps to include UnityNuGet in your project's `manifest.json`:

```json
{
  "scopedRegistries": [
    {
      "name": "Unity NuGet",
      "url": "https://unitynuget-registry.azurewebsites.net",
      "scopes": [
        "org.nuget"
      ]
    },
    // ... (other scoped registries)
  ]
}

```

## List all UnityNuGet Packages

You can browse the curated list of UnityNuGet packages on the [UnityNuGet GitHub repository](https://github.com/xoofx/UnityNuGet/blob/master/registry.json). This list contains details about various UnityNuGet packages.

To programmatically access information about all available UnityNuGet packages, you can use the [`/-/all` API endpoint](https://unitynuget-registry.azurewebsites.net/-/all). This API endpoint provides a JSON response with comprehensive data on the packages.

```sh
$ curl -s https://unitynuget-registry.azurewebsites.net/-/all | json -k
```

Choose the method that best suits your needs to explore and discover UnityNuGet packages for your Unity projects.
