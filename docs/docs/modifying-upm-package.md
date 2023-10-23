---
---
# Modifying UPM Package

## Modifying the Package Metadata YAML File

To make changes to the package metadata YAML file:

- Locate the package metadata YAML file at the [data/packages](https://github.com/openupm/openupm/tree/master/data/packages) folder.

- Alternatively, use the "Edit package metadata" link on the package detail page to find the file.

- Edit the content as needed.

- Create a pull request. Your PR will be merged after review.

## Unpublishing a Version

Published releases on the OpenUPM registry are **immutable**, as modifying or deleting a published version is considered bad practice. These releases are already being used by other developers, transferred to our CDN, and cached at multiple levels in the CDN, user's cache server, Unity local cache, and more. Changing them can introduce inconsistencies. Even if you believe a version contains a major bug, the recommended approach is to bump the version and publish the fix in this manner.

However, there are specific cases in which you can contact us to request the unpublishing of a specific version:

- The version inadvertently leaks security information, such as accidentally committing a private key and publishing it.
- The version contains harmful content that may endanger the developers who install it.
- The version violates our package guidelines.

If you have a valid reason for unpublishing a version, please delete the related Git tag, and then [create an issue](https://github.com/openupm/openupm/issues/new?title=Unpublish%20package%20version&template=unpublish_version.md) to request the unpublishing of that version.

If you delete or replace published Git tags on your GitHub repository without notifying us, these changes will not affect the content already published on OpenUPM.

## Renaming a Package

To rename a published package, please follow these steps:

- In your repository, modify the package name in the `package.json`, bump the version, and create a new Git tag.

- Locate the package metadata YAML file and update the filename and the `name` field to the new name. If the repository name is also changed, update the `repoUrl` field as well.

- Set the `minVersion` field to the newly created Git tag version so that the build-pipelines will ignore the old versions with the old package name.

- Create a pull request. Your PR will be merged after review.

## Transferring Package Ownership

To transfer package ownership, please follow these steps:

- In GitHub, transfer the package ownership to the new owner.

- Assuming the package name remains the same, locate the package metadata YAML file and update the `repoUrl` field to point to the new repository.

- This update is primarily for refreshing display information on the website and will not affect published versions.

- Create a pull request. Your PR will be merged after review.

## Delisting a Package

Package owners have the option to opt out of OpenUPM by following these steps:

- Remove the package metadata YAML file from the [data/packages](https://github.com/openupm/openupm/tree/master/data/packages) folder.

- Add the package scope to the [data/blocked-scopes.yml](https://github.com/openupm/openupm/tree/master/data/blocked-scopes.yml) file to prevent re-submission.

- Create a pull request. Your PR will be merged after review.

- Your package will be delisted from the OpenUPM website. However, published versions will remain on the registry to allow existing users to continue to access the content.

## Unpublishing a Package Entirely

Refer to [Unpublishing a Version](#unpublishing-a-version) to understand why we do not allow unpublishing existing versions.

However, there are specific cases in which you can contact us to request the unpublishing of the entire package from the registry:

- The package violates our package guidelines and cannot be fixed.

If you have a valid reason to unpublish all versions entirely, please [create an issue](https://github.com/openupm/openupm/issues/new?title=Unpublish%20package&template=unpublish_package.md).
