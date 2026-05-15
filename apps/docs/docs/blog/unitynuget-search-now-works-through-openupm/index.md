---
title: "UnityNuGet Search Now Works Through OpenUPM"
author: "Favo Yang"
date: "2026-05-15"
readingTime: "1 min read"
description: "OpenUPM's registry upgrade experimentally makes org.nuget packages visible through registry search while keeping UnityNuGet package resolution behind the OpenUPM endpoint."
---

# UnityNuGet Search Now Works Through OpenUPM

OpenUPM has upgraded its package registry runtime. One visible experimental
change for Unity developers is better UnityNuGet uplink behavior: packages
under the `org.nuget` scope can now appear in OpenUPM registry search results.

Previously, `org.nuget` packages resolved correctly when a project requested a
specific package, but registry search returned `404 packages not found` for
NuGet packages. That affected `openupm search` and the Unity Package Manager
search interface.

With the new registry runtime, the OpenUPM registry includes uplink search
results from UnityNuGet. You can still install and resolve packages through
`https://package.openupm.com`, and searches for `org.nuget` packages should now
work through the same OpenUPM registry endpoint.

We still treat searchable UnityNuGet uplinks as experimental. It is backed by
the current registry behavior and we expect it to be retained in future
upgrades, but it can still depend on UnityNuGet availability, cache freshness,
and upstream registry behavior.

The OpenUPM website package browser remains focused on curated OpenUPM packages,
so UnityNuGet packages are not listed as normal website package pages. For the
complete UnityNuGet package list, continue to use the UnityNuGet registry list
and documentation.

See the updated [NuGet Packages](/nuget/) documentation for usage details and
the remaining limitations.
