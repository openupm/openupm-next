---
title: "OpenUPM Queue Status Page"
author: "Favo Yang"
date: "2026-05-14"
readingTime: "1 min read"
description: "OpenUPM now has a public queue status page for package scan and release build activity."
editLink: false
---
# OpenUPM Queue Status Page

<BlogPostMeta />

OpenUPM now has a public queue status page:

[https://openupm.com/queue/](https://openupm.com/queue/)

The page shows package scan activity, release build queue health, recent
successful releases, and recent failed releases. It is meant to answer a simple
question without asking maintainers to check private dashboards: is OpenUPM
currently finding and building packages?

The package scan section shows active, waiting, delayed, and failed job counts.
It also includes the next scheduled scan countdown, so package maintainers can
see when the next scan cycle should start.

The release build section shows waiting, active, delayed, and failed release
jobs, plus the oldest waiting release age. Recent release tables include links
to packages, and failed release reasons link to the related Azure build when
that build information is available.

You can also find the page from the site footer under About, next to the
existing status link.

<BlogPostNav />
