---
layout: HomeLayout
showFooter: true
editLink: false
title: Open Source Unity Package Registry
heroText: Open Source Unity Package Registry
features:
- title: Open Source Packages
  desc: Hosts over <%= package_count %> open source packages, carefully curated by the community.
- title: Automated Package Publishing
  desc: Automatically tracks Git tags to streamline the publishing process and ensure packages are always up-to-date.
- title: Command-Line Interface
  desc: Empower command-line lovers with the OpenUPM-CLI tool for seamless UPM registry interaction.
---
### Get Started with CLI (Optional)

```sh
# Install openupm-cli
$ npm install -g openupm-cli
# OR yarn global add openupm-cli

# Enter your Unity project folder
$ cd YOUR_UNITY_PROJECT_FOLDER

# Search a package
$ openupm search addressable-importer
┌───────────────────────────────────────┬─────────┬───────────┬────────────┐
│ Name                                  │ Version │ Author    │ Date       │
├───────────────────────────────────────┼─────────┼───────────┼────────────┤
│ com.littlebigfun.addressable-importer │ 1.0.0   │ Favo Yang │ 2019-11-25 │
│ Unity Addressable Importer            │         │           │            │
└───────────────────────────────────────┴─────────┴───────────┴────────────┘

# Install package
$ openupm add com.littlebigfun.addressable-importer
added: com.littlebigfun.addressable-importer@0.4.1
manifest updated, please open unity project to apply changes
```

::: tip DISCLAIMER
OpenUPM is an autonomous, open-source service and is not associated with Unity Technologies Inc.
:::