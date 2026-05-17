---
title: "UnityNuGet Package Pages Now on OpenUPM"
author: "Favo Yang"
date: "2026-05-18"
readingTime: "2 min read"
description: "OpenUPM now generates website package pages for UnityNuGet packages, making org.nuget packages easier to find, inspect, and install from the web."
editLink: false
---
# UnityNuGet Package Pages Now on OpenUPM

<BlogPostMeta />

OpenUPM now generates website package pages for UnityNuGet packages.

Until now, `org.nuget` packages could be resolved through the OpenUPM registry
uplink, and recently became visible through registry search, but they were not
easy to browse on the OpenUPM website. That made common packages such as
`org.nuget.newtonsoft.json` harder to discover, inspect, and share from the
web.

UnityNuGet packages now have OpenUPM website pages with the same URL shape as
normal OpenUPM package pages. For example:

- [org.nuget.newtonsoft.json](/packages/org.nuget.newtonsoft.json/)
- [org.nuget.system.text.json](/packages/org.nuget.system.text.json/)

These pages can appear in website search results and are easy to share in
issues, documentation, and support answers.

Try searching for [org.nuget.system](/packages/?q=org.nuget.system) to see the
UnityNuGet package group in the package results.

## What You Can See

UnityNuGet package pages show the information that is useful for Unity Package
Manager users:

- package name and NuGet identity;
- latest version and available versions;
- description, author, and repository link when available;
- package dependencies;
- install commands for stable and latest versions.

This makes `org.nuget` packages easier to link in issues, documentation, and
support answers. It also gives Unity developers a single OpenUPM website entry
point for both native OpenUPM packages and UnityNuGet packages.

## Search Behavior

Website search can now find generated UnityNuGet package pages. Search results
show OpenUPM packages and UnityNuGet package pages as separate result groups so
the package source is clear.

This completes the first website-facing step after
[UnityNuGet search started working through OpenUPM](/blog/unitynuget-search-now-works-through-openupm/).
The goal is simple: `org.nuget` packages should be resolvable, searchable, and
shareable through OpenUPM without blurring the line between native OpenUPM
packages and UnityNuGet uplink packages.

See the updated [NuGet Packages](/nuget/) documentation for setup details and
current limitations.

<BlogPostNav />
