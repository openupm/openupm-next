---
editLink: false
showContentTopAd: false
showSearch: false
navbar: false
title: Unity开源软件包仓库
---
# OpenUPM中文网服务停止公告及迁移指南

基于一些原因，运营了3年半的OpenUPM中文网（含package.openupm.cn的镜像服务）要和大家说再见了。感谢所有支持过该服务的朋友。

[openupm.com](https://openupm.com)的主站还将正常运营。需要迁移的用户请参考以下步骤：

1. 访问[openupm.com](https://openupm.com)来代替openupm.cn。

2. 将`Packages/manifest.json`文件里的`package.openupm.cn`替换为`package.openupm.com`。

3. 如果你使用openupm-cli，将`openupm-cn`替换为`openupm`。

若你所在的区域无法访问相关服务，请参考以下步骤进行`package eject`，以保证项目的正常运行：

1. 打开`Packages/manifest.json`文件，记录下所使用openupm的scope。
2. 将`Library/PackageCache`目录中所有匹配的内容，移动到`Packages`目录下。
4. 删除`Packages/manifest.json`文件中openupm的相关内容。

感谢大家的支持，再会！

----

<div style="text-align: center; margin-top: 2rem;">
<small>版权所有 © 2019-至今 Favo Yang</small> •
<small>京ICP备18005908号-2</small> •
<small>京公网安备 11010502045830号</small>
</div>