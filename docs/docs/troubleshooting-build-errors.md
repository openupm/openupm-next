---
---
# Troubleshooting Build Errors

The build pipelines section on the package detail page reports the build status of each versioned Git tag, allowing you to check for any failed builds and their respective reasons. When a build fails, it leaves an error code and a message in the note field, providing valuable information for troubleshooting.

![build-pipelines](./images/package-detail-build-pipelines.png)

OpenUPM categorizes these errors into two types: retryable errors and non-retryable errors.

## Retryable Errors

**Retryable errors** are typically caused by temporary issues, such as network problems, and the build pipelines will automatically attempt to retry them up to three times. If the build still fails after three retries, the error remains unresolved. Below is a list of common retryable errors with explanations. You may find these error codes less informative because they generally indicate issues not on your end. If you encounter persistent errors of this nature, please report them to us by creating a [GitHub issue](https://github.com/openupm/openupm/issues/new/choose).

- `E0` unknown error: This error occurs when the build pipelines encounter an unknown error.

- `E400` bad request: This error occurs when the registry server cannot process a certain request due to a client error, such as an invalid request body. It usually indicates that the client is sending incorrect information to the server.

- `E401` unauthorized: This error arises when the registry server cannot process a particular request due to client authentication issues.

- `E403` forbidden: This error occurs when the registry server cannot process a specific request due to client permission errors.

- `E500` internal server error: This error indicates that the registry server has encountered an internal error, such as a database issue.

- `E502` bad gateway: This error is triggered when the reverse proxy server cannot connect to the registry server.

- `E504` gateway timeout: This error results from the reverse proxy server's inability to connect to the registry server due to a timeout.

- `E503` service unavailable: This error occurs when the reverse proxy tries to communicate with the registry server, but the registry server is not available.

- `E700` build timeout: This error is associated with the build process taking too long, leading to the build being considered failed. However, the build process may still be running, and the next retry might resolve the issue and mark it as successful.

- `E701` build cancelled: This error arises when the build process is canceled by the moderator.

- `E900` connection timeout: This error occurs when the build-pipelines failed to connect to resolve the registry server or the internet is not available.

## Non-retryable Errors

**Non-retryable errors** are usually caused by specific issues that cannot be fixed automatically by a rebuild. In such cases, the package owner needs to address these errors manually.

- `E413` entity too large: This error occurs when the package size exceeds the maximum allowed size of 500MB.

- `E409` version conflict: This error arises when a package with the same version is already published. This usually means you created a new Git tag but forgot to update the version field in the `package.json` file. To resolve this issue, please update the version field in the `package.json` file and retag the existing Git tag to the new commit.

- `E800` package not found: This error occurs when the build-pipelines fail to locate a `package.json` with the given package name. One possible reason is that you added the `package.json` to the main branch but forgot to create a new Git tag for it. Another possible reason is that the `package.json` has a syntax error, causing the build pipelines to fail during parsing.

- `E803` package name invalid: This error occurs when the build-pipelines detect a package name that does not conform to the reverse domain name notation with at least three segments. For example, `com.org.my-package` is a valid package name, but `org.my-package` is not.

- `E804` invalid format of `package.json`: This error occurs when the build-pipelines detect a `package.json` with an invalid format. For example, the `package.json` is missing required fields such as `name` or `version`.

- `E805` remote branch not found: This error occurs when the build-pipelines fail to locate the remote branch of the given Git tag. One possible reason is that the remote branch has been deleted.

- `E806` invalid version: This error occurs when the build-pipelines detect a `package.json` with an invalid version. For example, the `version` field is not a valid [semver](https://semver.org/) version.

- `E807` remote repository unavailable: This error occurs when the build-pipelines fail to connect to the remote repository. One possible reason is that the remote repository has been deleted or set to private.

- `E808` remote submodule unavailable: This error occurs when the build-pipelines fail to locate the remote submodule of the given Git tag. One possible reason is that the remote submodule is missing, deleted, or set to private.

- `E901` heap out of memory error: This error occurs when the build-pipelines fail to allocate sufficient memory for the build process. One possible reason is that the package is too large to process.

## How to Trigger a Rebuild for a Failed Build

So you've encountered a failed build and successfully fixed the issue. How do you trigger a rebuild? The solution is to re-tag the existing Git tag.

When the build pipelines detect a failed Git tag that has been re-tagged, it will initiate a rebuild. It's important to note that the build pipelines will not rebuild an already successful release, even if they detect that the Git tag has been removed or re-tagged. This is because what has been released on the registry is immutable.

To re-tag an existing Git tag, you can follow these steps:

1. Locate the Git tag on the GitHub website.
2. Delete the existing tag.
3. Create a new tag with the same name from the latest commit.

Alternatively, you can use the following commands to re-tag a Git tag:

```bash
# List all remote tags
git ls-remote --tags

# Delete the local tag
git tag -d v1.0.1

# Push the tag deletion to the remote
git push origin :refs/tags/v1.0.1

# Tag the local branch again
git tag v1.0.1

# Push the tag to the remote
git push origin tag v1.0.1
```

Some repositories adhere to an immutable policy that disallows re-tagging. In such cases, you can trigger a new build by incrementing the package version. For instance, if the erroneous Git tag is `v1.0.1`, you should update the package version to `1.0.2` and then create a new Git tag, `v1.0.2`, to initiate a new build.
