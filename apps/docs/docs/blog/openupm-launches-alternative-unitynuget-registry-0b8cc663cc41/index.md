---
title: "OpenUPM Launches Alternative UnityNuGet Registry"
author: "Favo Yang"
date: "2025-03-07"
readingTime: "2 min read"
originalUrl: "https://medium.com/openupm/openupm-launches-alternative-unitynuget-registry-0b8cc663cc41"
description: "OpenUPM introduces an alternate UnityNuGet hosting endpoint so Unity projects can continue resolving org.nuget packages after the Azure feed shutdown."
editLink: false
---
# OpenUPM Launches Alternative UnityNuGet Registry

<BlogPostMeta />

<figure><img alt="" src="./images/openupm-launches-alternative-unitynuget-registry-0b8cc663cc41-01-blog-image.png" /></figure>

<p>OpenUPM now hosts an alternative endpoint for the UnityNuGet registry. Alexandre Mutel (<a href="http://github.com/xoofx">@xoofx</a>) has resigned from Unity, and the UnityNuGet Azure feed is scheduled to stop on March 10. Thank you to Alexandre for creating UnityNuGet and keeping it useful for so many Unity projects.</p>

<h2>What changes</h2>

<p>The alternative registry is available at:<br> <a href="https://unitynuget-registry.openupm.com/"><strong>https://unitynuget-registry.openupm.com/</strong></a></p>

<p>The service tracks the latest UnityNuGet Docker image and receives regular updates. It currently runs on a small server, so we will watch usage and add capacity if traffic requires it.</p>

<p>The main OpenUPM registry now uplinks to this UnityNuGet endpoint, so existing OpenUPM uplink users can keep resolving org.nuget packages through OpenUPM.</p>

<h2>UnityNuGet maintenance</h2>

<p>Borja Domínguez (<a href="https://github.com/bdovaz">@bdovaz</a>) continues to maintain the UnityNuGet project. Developers can still submit NuGet packages to the curated list at:<br> <a href="https://github.com/xoofx/UnityNuGet/blob/master/registry.json"><strong>https://github.com/xoofx/UnityNuGet/blob/master/registry.json</strong></a></p>

<h2>How to support the service</h2>

<p>OpenUPM runs on a limited budget. If this registry helps your project, you can support it through <a href="https://www.patreon.com/openupm">Patreon</a>, <a href="https://github.com/sponsors/openupm">GitHub Sponsors</a>, or <a href="https://www.paypal.com/paypalme/favoyang">PayPal</a>.</p>

<p><em>References: </em><a href="https://github.com/xoofx/UnityNuGet/issues/480"><em>UnityNuGet Issue #480</em></a><em> | </em><a href="/nuget/"><em>OpenUPM NuGet Registry</em></a></p>

<p>OpenUPM is hosted on DigitalOcean. Our <a href="https://m.do.co/c/50e7f9860fa9">DigitalOcean referral link</a> includes a $200 onboarding credit valid for 60 days.</p>

<BlogPostNav />
