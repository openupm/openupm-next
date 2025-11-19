---
layout: HomeLayout
showFooter: true
editLink: false
title: Open Source Unity Package Registry
description: OpenUPM is a managed UPM registry with automatic build services for open-source Unity packages.
heroText: Open Source Unity Package Registry
features:
- title: Open Source Packages
  desc: Hosts over <%= package_count %> open source packages, carefully curated by the community.
- title: Automated Package Publishing
  desc: Automatically tracks Git tags to streamline the publishing process and ensure packages are always up-to-date.
- title: Command-Line Interface
  desc: Empower command-line lovers with the OpenUPM-CLI tool for seamless UPM registry interaction.
sponsors:
- text: Powerred by DigitalOcean
  slug: digital-ocean
  url: https://m.do.co/c/50e7f9860fa9
  image: https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/SVG/DO_Logo_horizontal_blue.svg
- text: Host your infrastructure on a DDoS protected VPS from Evolution Host
  slug: evolutionhost
  url: https://evolution-host.com/
  image: /images/evolution-host-logo-001.png
- text: Deploys by Netlify
  slug: netlify
  url: https://www.netlify.com/
  image: https://www.netlify.com/img/global/badges/netlify-dark.svg
---
## Sponsors

<SponsorList level="service" :items="$page.frontmatter.sponsors" />

## Get Started with OpenUPM-CLI

OpenUPM can be used directly as a registry through standard Unity Package Manager workflows, however, with the CLI, package installation and updates become faster, reducing manual steps and improving productivity.

<AdsenseDisplayForHomepage />

```sh
# Install openupm-cli
$ npm install -g openupm-cli

# Enter your Unity project folder
$ cd YOUR_UNITY_PROJECT_FOLDER

# Search a package
$ openupm search addressable-importer
┌──────────────────────────────────────────┬────────────────────┬────────────┐
│ Name                                     │ Version            │ Date       │
├──────────────────────────────────────────┼────────────────────┼────────────┤
│ com.littlebigfun.addressable-importer    │ 0.16.1             │ 2023-02-08 │
└──────────────────────────────────────────┴────────────────────┴────────────┘

# Install package
$ openupm add com.littlebigfun.addressable-importer
added com.littlebigfun.addressable-importer@0.16.1
please open Unity project to apply changes.
```
