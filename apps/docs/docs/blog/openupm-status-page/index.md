---
title: "A New OpenUPM Status Page"
author: "Favo Yang"
date: "2026-11-24"
readingTime: "1 min read"
description: "OpenUPM service availability now has a dedicated public page at status.openupm.com."
cover: "/images/blog-covers/openupm-status-page.png"
editLink: false
---
# A New OpenUPM Status Page

<BlogPostMeta />

OpenUPM now publishes service availability on its own domain:

[https://status.openupm.com/](https://status.openupm.com/)

The page checks the website, the API, the package registry, package downloads,
and the UnityNuGet registry every minute, with the heavier checks every five
minutes. Each service shows its current state and recent history, so you can
tell whether a problem is on your side or ours before opening a support issue.

The page is public and needs no account. If you see a failure that the page does
not show, please [open an issue](https://github.com/openupm/openupm/issues) with
the time and the command or URL you used.

The status link in the site's About menu now points to the new page. The
previous status page has been retired.

<BlogPostNav />
