---
title: "DigitalOcean Sponsorship & Our Server Infrastructure"
author: "Favo Yang"
date: "2021-03-10"
readingTime: "2 min read"
originalUrl: "https://medium.com/openupm/digitalocean-sponsorship-our-server-infrastructure-d1019b84d71c"
description: "OpenUPM announces DigitalOcean sponsorship and describes the public service infrastructure at a high level."
editLink: false
---
# DigitalOcean Sponsorship & Our Server Infrastructure

<BlogPostMeta />

I am delighted to announce a new ‘Service Sponsorship’ between OpenUPM and DigitalOcean.

Those wonderful people over at DO have agreed to sponsor OpenUPM. They’re providing us a very generous amount of credit which we will use to host this site and other infrastructure. If you’d like to sign up for their services you can using the following [referral link](https://m.do.co/c/50e7f9860fa9), and the new register will get decent onboarding rewards to try DO services. If you haven’t used their infrastructure before, give it a whirl. We were using it anyway even before this sponsorship.

![Image 7](./images/digitalocean-sponsorship-our-server-infrastructure-d1019b84d71c-01-image-7.png)

DigitalOcean has proven especially popular with companies developing network-intensive apps. e.g. video and audio streaming, gaming, real-time communication, IoT, web crawling — bandwidth costs can be substantial, perhaps even making up a majority of your cloud computing costs. DO charge much lower than the average cloud computing provider. It’s a strong selling point.


Without a deep pocket, OpenUPM uses a simple infrastructure based on our tight budget supported by service sponsorship like DO, [other individual donators](/contributors/), and of course myself:

![Image 8](./images/digitalocean-sponsorship-our-server-infrastructure-d1019b84d71c-02-image-8.png)

OpenUPM server infrastructure v1.0

*   Every piece of the graph gets its own server hosted by DigitalOcean.
*   Build pipelines query the GitHub API regularly to process new releases.
*   API server provides extra information for the website.
*   Registry server serves the Unity Pacman.

I admit that even it’s a trivial setup, the OpenUPM service is consists of lots of small pieces that talk to each other. Especially if you link GitHub Actions, Netlify CDN, and Azure pipelines into the graph. When OpenUPM gets more budget, we will upgrade to a more robust and scalable infrastructure.

Anyway, massive thanks to DigitalOcean for their generous sponsorship of this site and supporting open source!

<BlogPostNav />
