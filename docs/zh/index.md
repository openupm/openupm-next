---
layout: HomeLayout
editLink: false
title: Unity开源软件包仓库
description: OpenUPM是一个托管的开源UPM包管理器，提供了自动化的构建服务。
heroText: Unity开源软件包仓库
features:
- title: 开源软件包
  desc: 托管由社区精心挑选的超过 <%= package_count %> 个开源软件包。
- title: 自动化版本发布
  desc: 自动跟踪 Git 标签以简化发布流程，确保软件包保持更新。
- title: 命令行界面
  desc: 通过 OpenUPM-CLI 工具赋予命令行爱好者高效的 UPM registry交互能力。
---
### 命令行工具入门（可选的）

```sh
# 从NPM安装 openupm-cli
$ npm install -g openupm-cli
# 或者使用Yarn
$ yarn global add openupm-cli

# 进入Unity工程目录
$ cd YOUR_UNITY_PROJECT_FOLDER

# 搜索软件包
$ openupm-cn search addressable-importer
┌───────────────────────────────────────┬─────────┬───────────┬────────────┐
│ Name                                  │ Version │ Author    │ Date       │
├───────────────────────────────────────┼─────────┼───────────┼────────────┤
│ com.littlebigfun.addressable-importer │ 1.0.0   │ Favo Yang │ 2019-11-25 │
│ Unity Addressable Importer            │         │           │            │
└───────────────────────────────────────┴─────────┴───────────┴────────────┘

# 安装软件包
$ openupm-cn add com.littlebigfun.addressable-importer
added: com.littlebigfun.addressable-importer@0.4.1
manifest updated, please open unity project to apply changes
```

::: tip 免责声明
OpenUPM 是一个独立的开源服务，与 Unity Technologies Inc. 没有关联。
:::
