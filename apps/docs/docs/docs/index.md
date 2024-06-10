---
---
# Introduction

Welcome to OpenUPM, your solution for open-source Unity Package Manager (UPM) packages. OpenUPM is a user-friendly service that hosts, manages, and automates the building of UPM packages. We're here to make it easy for you to find, share, and distribute open-source UPM packages.

::: tip DISCLAIMER
OpenUPM is an autonomous, open-source service and is not associated with Unity Technologies Inc.
:::

## How It Works

### Scoped Registry

Unity offers a [scoped registry](https://docs.unity3d.com/Manual/upm-scoped.html) feature, which allows developers to set up third-party registries for hosting custom packages. OpenUPM simplifies this process by providing a public UPM registry at `https://package.openupm.com` and a set of tools to assist you.

### Automatic Build Pipelines

OpenUPM maintains a [curated list](https://github.com/openupm/openupm/tree/master/data/packages) of open-source UPM repositories hosted on GitHub. Our build pipelines regularly monitor this list, detecting versioned Git tags, bundling assets, and automatically publishing them to the OpenUPM registry as packages. This continuous publishing approach differs from traditional package registries, which often require package owners/maintainers to submit new releases manually. With OpenUPM, any developer with a GitHub account can contribute new UPM packages to the platform, making it accessible and user-friendly. These contributors are known as [Package Hunters](/contributors/) and play a vital role in accelerating community growth.

### Package Discovery

OpenUPM renders the curated list on its website, allowing you to filter packages by topics, search for keywords, and sort them by downloads, all to help you easily find your favorite open-source packages.

![openupm website screenshot](./images/openupm-website-screenshot-20231022.png)

### Command-Line Interface

The idea behind a scoped registry is that you need to specify the [scope field](https://docs.unity3d.com/Manual/upm-manifestPrj.html) in `Packages/manifest.json` in advance to inform Unity about which packages are associated with a registry. This limitation can create additional work when installing a package from a scoped registry. Managing package dependencies and multiple namespaces can be a headache, especially when you have to manually fill the scope field for each package, and it becomes even more complex when dealing with layered dependency chains. For instance, if package-a depends on b, and b depends on c, you would need to manually resolve and specify all these dependencies in the scope field.

However, when you install a package from the OpenUPM website, it automatically provides the required scope field for you.

Furthermore, we've created a command-line tool known as [openupm-cli](https://github.com/openupm/openupm-cli) to manage the manifest file. This tool allows you to add, update, and remove for packages using a single command in most terminal apps like Bash, Git-Bash, CMD, or PowerShell. When Unity detects changes in the manifest file, it will automatically resolve and synchronize the packages for you.

For a guide on using the command-line tool, check out [Getting Started with CLI](./getting-started-cli.md).

## Alternatives

This section provides a brief overview of the alternatives to OpenUPM and how they compare. We hope this information will help you decide which solution is best for your needs.

### Unity Asset Store

The [Unity Asset Store](https://assetstore.unity.com/) serves as the official platform for publishing software and assets, providing a convenient means to monetize your Unity content. The Asset Store was originally designed for mutable content that could be located anywhere in the `Assets` folder, such as 3D models, textures, and scripts. As a result, you don't have a consistent way to uninstall an asset, and updating a version can be tricky. Later, Unity introduced a way to allow you to include a UPM package within an Asset Store asset, basically allowing you to package content under the `Packages` folder. However, it's not designed to function as a package registry, and it won't automatically resolve 3rd-party package dependencies for you.

When working with 3rd-party content, we all desire continuous support from the author. Since the Unity Asset Store is well-suited for paid content, assets that achieve financial success are likely to receive better support. On the other hand, OpenUPM, being centered around open-source content, relies more on the community for support. You can become part of this community to report bugs, fix issues, and even contribute new features.

We don't see the Unity Asset Store as a competitor to OpenUPM. There are many great assets on the Asset Store, and we encourage you to use it. Some mutable parts are more suitable for publishing on the Asset Store, such as 3D models, textures, and dedicated solutions for specific domains. More fundamental software may be better suited for publishing on OpenUPM. You can even choose to publish your content on both platforms. For instance, you can publish the core package on OpenUPM and provide a fully-featured demo project on the Asset Store.

### NuGet and UnityNuGet

NuGet is a package manager for the Microsoft .NET platform. UnityNuGet is a project that provides a service to bundle NuGet packages into the UPM format. The OpenUPM registry uplinks to the UnityNuGet registry to make it easier to use a NuGet package. You can learn more about this process in the [NuGet Packages](/nuget/) section.

### Using UPM via Git URL

Since Unity 2019.3, developers can install UPM packages directly via a Git URL. This is a quick way to install packages; however, it has some limitations:
- It lacks version control.
- It lacks support for custom packages with Git dependencies. Git URL is not the standard syntax for package dependencies, which means you cannot resolve a custom package that depends on another custom package using Git URLs.

While using Git URLs is a quick way to pick up a package, if you desire a better version control experience, you can encourage the package author to publish the package on OpenUPM.

## Credits for OpenSource Projects and Services

OpenUPM is an open-source service, and it wouldn't be possible without the invaluable contributions of these amazing projects and services.

Open-source software

- [Verdaccio](https://verdaccio.org/) for the package registry.
- [Vuepress 2](https://v2.vuepress.vuejs.org/) for documentation writing.
- [Spectre](https://github.com/picturepan2/spectre) for styling.
- [Font Awesome](https://fontawesome.com/license/free) for icons.

Open-source friendly services (affiliate links included)

- [Digital Ocean](https://m.do.co/c/50e7f9860fa9) for cloud VM.
- [Azure Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/) for build pipelines.
- [Netlify](https://github.com/netlify) for hosting the website.
- [Mergify](https://mergify.io/) for automated merging (use referral code `openupm-241828` to get one year of free seats).

## What's Next?

You can get started with OpenUPM by following the links below:
- [Getting Started with Unity Editor](./getting-started.md)
- [Getting Started with CLI](./getting-started-cli.md)

You can also read [Frequently Asked Questions](./faq.md) and learn about how to [Adding UPM Package](./adding-upm-package.md).
