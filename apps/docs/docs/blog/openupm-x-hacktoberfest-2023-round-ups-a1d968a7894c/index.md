---
title: "OpenUPM x Hacktoberfest 2023 Round-ups"
author: "Favo Yang"
date: "2023-11-01"
readingTime: "3 min read"
originalUrl: "https://medium.com/openupm/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c"
description: "A recap of OpenUPM's Hacktoberfest 2023 work, including package hunters, community submissions, and site improvements."
editLink: false
---
# OpenUPM x Hacktoberfest 2023 Round-ups

<BlogPostMeta />

<p>Unity had a rough month, and many Unity developers were watching the ecosystem more closely than usual. OpenUPM used Hacktoberfest 2023 to ship several site improvements that had been waiting in the queue.</p>

<p>OpenUPM now has a dark theme for late-night browsing.</p>
<figure><img alt="OpenUPM Dark Theme" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-01-openupm-dark-theme.jpg" /><figcaption>OpenUPM Dark Theme</figcaption></figure>

<p>The package list also received a more consistent layout.</p>
<figure><img alt="New Designed Package List" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-02-new-designed-package-list.jpg" /><figcaption>New Designed Package List</figcaption></figure>

<p>Package list scrolling now uses virtualization. That keeps memory usage stable when browsing long result sets and avoids the crashes some users hit with the old list.</p>

<p>Topics and categories are easier to scan now.</p>
<figure><img alt="New Designed Topic List" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-03-new-designed-topic-list.jpg" /><figcaption>New Designed Topic List</figcaption></figure>

<p>OpenUPM can sort packages by monthly downloads, which makes popular packages easier to find.</p>
<figure><img alt="Sort Packages by Monthly Downloads" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-04-sort-packages-by-monthly-downloads.png" /><figcaption>Sort Packages by Monthly Downloads</figcaption></figure>

<p>The package list now supports keyword filtering.</p>
<figure><img alt="Search by Keywords" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-05-search-by-keywords.jpg" /><figcaption>Search by Keywords</figcaption></figure>

<p>The package add form now shows a package card preview, so maintainers can check what they are about to submit.</p>
<figure><img alt="" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-06-blog-image.jpg" /><figcaption>New Designed Package Add Form</figcaption></figure>

<p>The site has also moved to <a href="https://github.com/vuepress/vuepress-next">vuepress-next</a>, and parts of the codebase now use TypeScript.</p>

<p>ComradeVanti migrated openupm-cli to TypeScript in pull request <a href="https://github.com/openupm/openupm-cli/pull/52">#52</a>. That was a useful contribution on its own, and ComradeVanti is also one of our backers.</p>

<p>Traffic increased after the redesigned site launched.</p>
<figure><img alt="The Views Bump Up Since the Launch of the Revamped Website" src="./images/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c-07-the-views-bump-up-since-the-launch-of-the-revamped-website.png" /><figcaption>The Views Bump Up Since the Launch of the Revamped Website</figcaption></figure>

<p>OpenUPM remains an independent service. Unity is not involved in sponsorship or development. The project is backed by individual developers who care about game development and open source packages, and that support matters when the wider Unity ecosystem feels uncertain.</p>

<p>If you appreciate the work, you can sponsor OpenUPM on Patreon at <a href="https://www.patreon.com/openupm">patreon.com/openupm</a>.</p>

<BlogPostNav />
