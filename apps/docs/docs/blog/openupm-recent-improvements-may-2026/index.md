---
title: "OpenUPM Recent Improvements, May 2026"
author: "Favo Yang"
date: "2026-05-17"
readingTime: "3 min read"
description: "A short roundup of recent OpenUPM package page, build reliability, community support, and registry reliability improvements."
cover: "/images/blog-covers/openupm-recent-improvements-may-2026.png"
editLink: false
---
# OpenUPM Recent Improvements, May 2026

<BlogPostMeta />

OpenUPM shipped a set of smaller improvements between May 15 and May 17, 2026.
Some were already covered separately, including
[UPM package signing](/blog/signing-upm-packages-with-openupm/),
[UnityNuGet package signing](/blog/unitynuget-packages-are-now-code-signed/),
the [queue status page](/blog/openupm-queue-status-page/), and
[UnityNuGet search through OpenUPM](/blog/unitynuget-search-now-works-through-openupm/).
This roundup covers the remaining user-visible changes.

## Package Pages

Package install commands now prefer
[stable releases](https://github.com/openupm/openupm/issues/5229) when a package
has both stable and prerelease versions. The latest prerelease command remains
available, but the default path is clearer for projects that want the most
recent stable package version.

Package pages also expose more maintenance context. Archived GitHub repositories
now show an [archived status chip](https://github.com/openupm/openupm/issues/5060),
and README sections can show when the synced
[README content was last updated](https://github.com/openupm/openupm/issues/5177).
[Manual installation modal](https://github.com/openupm/openupm/issues/6305)
links can be opened directly, which makes support answers easier to share.

## Package Authoring

Several changes focused on making package releases easier to understand and
less likely to publish the wrong thing. The Builds section can now show the
actual package version published by a build when that information is available,
while keeping a fallback for older release records. Git-source builds now
validate that the discovered
[`package.json` version](https://github.com/openupm/openupm/issues/4483) matches
the queued package version before publishing.

Website-only [package rename redirects](https://github.com/openupm/openupm/issues/3005)
are now supported through package metadata, while registry package names remain
unchanged so Unity projects still update dependencies explicitly. Package JSON
parsing now tolerates a leading
[UTF-8 byte order mark](https://github.com/openupm/openupm/issues/4135), which
avoids rejecting otherwise valid manifests saved by some editors. New git-source
publishes also include
[source repository metadata](https://github.com/openupm/openupm/issues/5863) in
the generated package manifest.

## Registry Reliability

The registry runtime has been stabilized on Verdaccio 6. That upgrade is what
made the separate UnityNuGet search improvement possible, and it gives OpenUPM a
current supported registry base for future work.

<BlogPostNav />
