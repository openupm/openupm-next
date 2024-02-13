---
---
# Adding UPM Package

## UPM Package Criteria

OpenUPM requires packages to meet the following criteria:

1. **Package Name:** The package name must adhere to the [Unity Package Manager naming convention](https://docs.unity3d.com/Manual/cus-naming.html) by using "reverse domain name notation" with at least three segments, like `com.yourname.package-name`. Please make sure the package name matches the name in the `package.json` file. Avoid using a scope that might cause confusion for others. For instance, do not use the `com.unity` scope unless you are affiliated with Unity Technologies. The same applies to scopes like `com.github` and other well-known scopes. Additionally, refrain from using the `com.example` scope, as it is reserved for internal testing purposes.

2. **Unity Terms and Package Guidelines:** The package should comply with [Unity Terms](https://unity3d.com/legal/terms-of-service/software) and [Package Guidelines](https://unity.com/legal/terms-of-service/software/package-guidelines).

3. **Open-Source and GitHub Hosting:** The package must be open-source and hosted on GitHub. It is recommended to select a license from the [spdx license list](https://spdx.org/licenses). If the package uses dual licenses or has other constraints, ensure that these are clearly presented to the user.

4. **Functionality and Usefulness:** The package should be functional and useful. Test packages are not accepted due to limited resources. It's advised to import your package via Git URL and test it before submission.

5. **Semantic Versioning:** The package should use [semantic versioning (semver)](https://semver.org/). For example, `1.1.0`, `1.1.1-preview`, `v1.1.2`. You can create Git tags using the [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release) feature or automate the process using [GitHub actions](https://medium.com/openupm/how-to-maintain-upm-package-part-2-f352fbf5f87c).

6. **Package Size:** The package size should be under 512MB due to limited resources. If OpenUPM receives more funding in the future, we may increase this limit.

7.  **Legal Compliance:** The package must conform to local laws and regulations, ensuring that it does not promote hate speech, discrimination, or any harmful content. Additionally, it should not infringe upon intellectual property rights or violate any copyrights, trademarks, or patents.

8.  **Forked Repositories:** If you're submitting a forked package with the original package name, please make only minimal changes to add UPM support (convert the C# project into UPM format by adding necessary files) to avoid confusion. If you plan to significantly modify the original package, change its name to your own package name, like `com.yourname.original-package-name`.

9.  **Unity Packages:** Please be aware that Unity publishes its own packages on the Unity registry or GitHub. You can only publish a package to OpenUPM if it is not already available on the Unity registry. This ensures that OpenUPM serves as a platform for packages that are not part of Unity's official offerings.

10. **Uplinked NuGet Packages:** We strongly encourage you to submit NuGet packages to [UnityNuGet](/nuget/) that have been uplinked by the OpenUPM registry. However, if you have a specific need to publish a NuGet package directly on OpenUPM, please use your own scope, such as `com.yourname.nuget-package-name`.

By adhering to these guidelines, package maintainers can contribute to a thriving ecosystem of Unity packages on OpenUPM, benefiting developers and users alike. Packages that do not meet these criteria will be rejected or removed from the OpenUPM platform.

11. **Package Retention Policy**: The package should have at least one release within 3 months of being submitted to OpenUPM. Otherwise, it will be removed from the service.

## Repository Folder Structures

There are two typical folder structures for UPM repositories, and OpenUPM build pipelines can handle both of them:

- UPM package at the root path.
- UPM package in a sub-folder, such as `Assets/package-name` or `Packages/com.namespace.package-name`.

Regardless of where the `package.json` is located, the build pipelines will detect it and handle it correctly.

## Package Metadata YAML File

OpenUPM utilizes a YAML file to store package information. Below is an example of such a YAML file. The build pipelines continuously monitor all package metadata YAML files and identify new Git tags to build as new versions.

```yaml
# The package name
name: com.namespace.unitypackageexample
# The package display name
displayName: Unity Package Example
# The short package description
description: An unity package example
# The repository url
repoUrl: 'https://github.com/author/reponame'
# The forked repository url
parentRepoUrl: null
# The Software Package Data Exchange® (SPDX®) license id
licenseSpdxId: MIT
# The license name
licenseName: MIT License
# A list of topic slugs. See all options at https://github.com/openupm/openupm/blob/master/data/topics.yml
topics:
  - utilities
# Filtering Git tags based on their prefix (this is not a regular expression).
# It’s particularly useful for monorepos to distinguish between Git tags. i.e. 'com.example.foo/'.
gitTagPrefix: ''
# The regular expression that specifies intentionally untracked Git tags that should be ignored
gitTagIgnore: '-master$'
# The minimal version to build. Leave it blank to build all versions.
minVersion: '1.0.5'
# The featured image URL. It should point to a valid image URL instead of a web page that presents the image.
# Leave it blank to use the generated default image.
image: 'https://github.com/author/reponame/raw/master/path-of-img.png'
# The featured image fit mode: cover (default) or contain. Learn more at https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
imageFit: cover
# The README.md file path (branchname:filename)
readme: 'main:README.md'
# The package hunter's GitHub username
hunter: author
```

## Using the Package Add Form

Package hunters can utilize the [package add form](/packages/add/) to simplify the preparation of the package metadata YAML file. This form will guide you through the process of filling in the necessary information, generate the YAML file, and enable you to submit it as a pull request on GitHub through your browser.

![Package Add Form](./images/package-add-form-v2.png)

For users new to this repository, you will first be prompted to fork it in order to submit a pull request.

![Fork repository](./images/fork-repository.png)

Please adhere to one of the specified pull request title formats: either `Create <package-name>.yml` or `chore(data): new package <package-name>`. With this format, the pull request will be automatically merged. The CI system will run a test to verify the submitted file, update the website, and trigger the build pipelines. It's worth noting that first-time contributors who are new to GitHub will require moderator approval for the pull request to initiate the test. We aim to approve such requests within 24 hours.

After a brief pause, during which the build pipelines complete their tasks (usually ranging from 15 minutes to half an hour, depending on the size of your repository), you can access the package's detailed page at the URL `https://openupm.com/packages/com.your-org.package-name` and review the build results in the **version history** and **build issues** sections. You can also search for your package name on the homepage to locate it. If you encounter any issues, please leave a comment on the pull request, and we'll do our best to assist you. If you prefer a chat, feel free to join our Discord server via this link: [https://discord.gg/FnUgWEP](https://discord.gg/FnUgWEP).

## Troubleshooting

### Handling a Repository without Git Tag

The repository you submitted must have at least one versioned Git tag to trigger the build pipelines. Therefore, submissions without a Git tag for an extended period will be removed from the OpenUPM list. If you wish to add such a repository, please create an issue on the author's repository to request the addition of a Git tag. For guidance on automating the release process with GitHub actions, you can refer to [this tutorial](https://medium.com/openupm/how-to-maintain-upm-package-part-2-f352fbf5f87c).

### Handling Prefixed Git Tags

Some repositories use different content for different tags, for example, `1.0.0` for the main branch and `upm/1.0.0` for the UPM branch. In such cases, you need to specify the `gitTagPrefix` field in the package YAML file. For instance, set `gitTagPrefix: "upm/"` to prevent confusion in the build pipelines due to duplicated version tags. Without specifying a prefix, the build pipelines will treat `1.0.0` and `upm/1.0.0` as the same version tag and only build one of them. By default, a tag name with the prefix `upm/` takes higher priority. For example, `1.0.0` and `upm/1.1.0` will result in building only `upm/1.1.0`.

### Handling Monorepo

Monorepo is a practice that organizes multiple packages in a single repository, usually laid out as follows:

```
Packages/
  com.namespace.foo/
    package.json
  com.namespace.bar/
    package.json
```

For monorepos, multiple package submissions are required. You need to submit packages one by one to the OpenUPM platform. If you submit more than one package metadata YAML file in a single pull request, the CI system will not merge it automatically but will wait for a moderator to review and merge it manually.

There are two strategies to manage monorepo versions:

1. Synchronize all packages to the same version. This means that when you update `com.namespace.foo` to `1.0.1`, you need to update `com.namespace.bar` to `1.0.1` as well. Then you can create one Git tag `1.0.1` for both packages. The build pipelines will detect the tag and build both packages under their own package names.
2. Use different versions for each package. This means that when you update `com.namespace.foo` to `1.0.1`, you can keep `com.namespace.bar` at `0.1.0`. Then you need to create two Git tags with different prefixes, `com.namespace.foo/1.0.0` and `com.namespace.bar/0.1.0`. The build pipelines will detect the tags based on the `gitTagPrefix` field in the package YAML file.

Each approach has its pros and cons, so please choose the one that best suits your needs.

### Handling Custom Build Tasks

OpenUPM does not support custom build tasks. As a workaround, we suggest delegating this task to CI systems like GitHub Actions.

- For minimal customizations, such as relocating the sample folder, you can build the content into an `upm` branch (a build branch) and then tag the `upm` branch as a versioned Git tag for OpenUPM to utilize.
- For more complex customizations, like building DLLs, you can push the build content into a separate (build) repository and then submit that build repository to OpenUPM.

While this approach may not be perfect, it is the best solution we can offer at this time. If you have a better idea, please share it with us on [GitHub Discussions](https://github.com/openupm/openupm/discussions).

## Conclusion

We hope this guide has helped you understand how to add a UPM package to OpenUPM. To learn more about how to handle a failed build, please continue reading the [Troubleshooting Build Errors](./troubleshooting-build-errors.md) guide.
