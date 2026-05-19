---
---
# Frequently Asked Questions

This page covers frequently asked questions about OpenUPM.

**Q: Is this project associated with Unity Technologies Inc.?**

No, OpenUPM is an autonomous, open-source service. While building good collaboration with Unity is always welcomed, it is worth noting that, at the time of writing, Unity has no involvement in this project in terms of sponsorship or development. You can verify this by checking the [contributor list](/contributors/).

**Q: Can I use Version Ranges in manifest.json or the dependencies of package.json?**

No, although Unity reuses the NPM protocol, it does not support version ranges like `>1.4.0`, `^1.4.0`, or `~1.4.0`. You can only specify a specific version number.

**Q: Can I use Git dependencies in manifest.json or the dependencies of package.json?**

Git dependencies are only supported in manifest.json, but not in the dependencies of package.json.

**Q: How can I deprecate a package version?**

While package deprecation is a feature of NPM, it is not implemented by the Unity Package Manager in the Editor. Therefore, we do not support it at the moment.

**Q: What is the package unpublish policy?**

The package unpublish policy has been broken down into the version unpublish policy and the package unpublish policy. You can read more about this in the [Modifying UPM Package](./modifying-upm-package.md) documentation.

**Q: Should I use a specific scope like `com.foo.bar` or a broader scope like `com.foo` when installing a package?**

The OpenUPM website and openupm-cli use specific scopes like `com.foo.bar` when installing packages. This approach is taken because we don't assume that all packages under the same scope are hosted on OpenUPM. As a user, you have the choice to use a broader scope like `com.foo` if you have more than one package under the same scope. This can result in faster network access when resolving packages from the registry.

**Q: How does the README file sync work?**

OpenUPM displays the README file from your GitHub repository as your package's front page. The path of the README file is specified in the `readme` field of the package metadata YAML file, for example, `readme: 'main:README.md'`. The sync process is triggered every few hours.

**Q: How do I code sign my package for Unity 6.3?**

Unity 6.3 introduced package signature verification, and unsigned packages may show a warning in the Unity Editor Package Manager UI. OpenUPM supports signed packages through GitHub Release asset tracking, where you sign the UPM tarball in your own CI workflow and OpenUPM publishes that release asset unchanged. See [Signing UPM Packages](./signing-upm-packages.md).

**Q: Can I publish a custom build output, such as generated files or DLLs?**

Yes. Use GitHub Release asset tracking when OpenUPM should publish a tarball produced by your own build workflow instead of packing directly from the tagged Git checkout. This is also the recommended path for signed packages. See [Signing UPM Packages](./signing-upm-packages.md).

**Q: Should my package use Git LFS on GitHub?**

Be careful with Git LFS on GitHub-hosted package repositories. GitHub's [Git LFS billing documentation](https://docs.github.com/en/github/managing-large-files/about-storage-and-bandwidth-usage) says that LFS downloads count against the repository owner's bandwidth, not against the individual user or service that pulls the files. Forks and automated downloads can also consume the parent repository owner's bandwidth.

OpenUPM needs to fetch package contents when building releases. If your package depends on Git LFS objects, repeated package builds and user workflows can spend the repository owner's Git LFS bandwidth quickly, especially for large binary files or monorepos with unrelated LFS assets.

For packages with large generated files, DLLs, signed tarballs, or other binary artifacts, we recommend publishing a `.tgz` or `.tar.gz` package through GitHub Releases and setting `trackingMode: githubRelease` in the package metadata. In that mode OpenUPM downloads and republishes the release asset you built, instead of cloning the tag and pulling Git LFS objects. See [Publishing from a GitHub Release Asset](./adding-upm-package.md#publishing-from-a-github-release-asset).

**Q: Can I add a commercial option for my open-source packages?**

It depends. In the [Unity Package Guiding Principles & Guidelines](https://unity.com/legal/terms-of-service/software/package-guidelines), it states that:

> You cannot make any Package (including via Package update) available from within the Unity Editor to third parties (other than your Designated Users) that, directly or indirectly, advances or is intended to advance the commercial or economic interests of you and/or your affiliated entities. For example:
> - A Package that induces a person to buy or subscribe to products or services.
> - A Package that otherwise enables or affects a commercial transaction.

Essentially, Unity restricts monetizing your open-source projects. However, there are a few options to consider:

- Split your package into a commercial version and an open-source version. The open-source version will be hosted on OpenUPM, while the commercial version can be published on the Unity Asset Store. When you publish your package on the Unity Asset Store, it will be covered by the [Asset Store Terms of Service and EULA](https://unity.com/legal/as-terms), which is a different license from the open-source version. Typically, the commercial version of the package will have additional features, such as pro features, an example project demonstrating how to use the package, or enhanced support.
- Host your package on GitHub only and opt-out from the OpenUPM registry. Since the *Unity Package Guiding Principles & Guidelines* apply only to the scoped registry. Then you can use a dual-license strategy to add a commercial option.
- Be creative and find your own workaround.

Please note that in any case, you should read the *Unity Package Guiding Principles & Guidelines* carefully to verify your strategy.

**Q: Why doesn't OpenUPM create a solution to list all packages in the Unity Editor?**

Unity does not allow it. In the [Unity Package Guiding Principles & Guidelines](https://unity.com/legal/terms-of-service/software/package-guidelines), it states that:

> C. You cannot create a marketplace, store, or platform to promote, advertise, or distribute your Packages, products or services to third parties (other than your Designated Users) from within the Unity Editor. For example:
> Your Package may not add advertisements or a storefront designed to sell or promote products or services via the Unity Editor UI.
You cannot use console messages to advertise services or commercial packages

**Q: What download stats does OpenUPM provide?**

We have created a [homemade Verdaccio plugin](https://github.com/openupm/verdaccio-install-counts) to offer a similar but feature-limited [download stats API](https://github.com/npm/registry/blob/master/docs/download-counts.md#per-version-download-counts) like NPM.

On the website, we provide the monthly download count, a monthly download sparkline chart, and a download badge that you can add to your GitHub README file. The monthly download count is calculated by summing the download count of all versions of the package in the last 30 days, and it is updated daily.

We do not offer per-version download stats at the moment.
