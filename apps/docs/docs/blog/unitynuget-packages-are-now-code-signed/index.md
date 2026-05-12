---
title: "UnityNuGet Packages Are Now Code Signed"
author: "Favo Yang"
date: "2026-05-13"
readingTime: "1 min read"
description: "UnityNuGet packages served through OpenUPM are now code signed, with daily cache verification to keep mirrored package versions current."
editLink: false
---
# UnityNuGet Packages Are Now Code Signed

<BlogPostMeta />

UnityNuGet packages are now code signed. OpenUPM has synced the UnityNuGet
cache, so packages resolved through OpenUPM can receive the newly signed
versions.

We have also deployed a daily job that compares the OpenUPM cache with the
UnityNuGet registry versions. When a cached UnityNuGet package is out of date,
the job updates the cached package so the OpenUPM mirror stays aligned on a
daily basis.

If your Unity project already downloaded an older `org.nuget` package, Unity
may continue using the local cached copy. To force Unity to fetch the signed
package again, close Unity, clean the Unity Package Manager cache, then reopen
the project and run a force resolve.

Unity documents the local cache locations here:

```text
https://docs.unity3d.com/Manual/upm-cache.html
```

In particular, check the global `npm` and `packages` cache folders, and remove
cached entries for `package.openupm.com` or `unitynuget-registry.openupm.com`
that contain `org.nuget` packages.

If Unity still shows a signature mismatch after the local cache has been
purged and the project has been resolved again, please create a new
[OpenUPM issue](https://github.com/openupm/openupm/issues/new) and include the
Unity version, package name, package version, registry URL, and the full
mismatch message.

Reference: [UnityNuGet issue #636](https://github.com/bdovaz/UnityNuGet/issues/636).

<BlogPostNav />
