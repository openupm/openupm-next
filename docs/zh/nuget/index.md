---
pageClass: page-nuget
---
# NuGet 软件包

::: warning 实验性
UnityNuGet uplink是一个实验性功能。
:::

[NuGet](https://docs.microsoft.com/en-us/nuget/what-is-nuget) 是 .NET 的包管理器，旨在使开发人员共享基础性的可重用代码。许多UPM包内嵌了NuGet的DLL。当两个UPM包含有相同的DLL或同一NuGet DLL的不同版本时，会出现版本冲突问题，不得不手动改名。更好的解决方案是创建一个含有NuGet DLL的UPM包，使之成为其他UPM包的依赖关系。

感谢xoofx的[UnityNuGet](https://github.com/xoofx/UnityNuGet)项目，提供了将NuGet包打包为UPM包的服务。类似于OpenUPM，UnityNuGet含有一个[社区维护的NuGet包列表](https://github.com/xoofx/UnityNuGet/blob/master/registry.json)。并通过[unitynuget-registry.azurewebsites.net](https://unitynuget-registry.azurewebsites.net)的软件包仓库托管，并使用统一的`org.nuget`作用域。

OpenUPM软件包仓库[uplinks](https://verdaccio.org/docs/en/uplinks)到UnityNuGet软件包仓库，以便更轻松地使用NuGet包。

- OpenUPM软件包仓库每小时与UnityNuGet软件包仓库同步。
- 缓存的tarballs也托管在CDN上。
- 您可以通过openupm-cli `openupm view org.nuget.some-package`查看包详细信息。

该集成带有一些限制：

- NuGet包在OpenUPM网站上不可被搜索或浏览。
- NuGet包在OpenUPM软件包仓库的API搜索接口中不可被搜索。
- NuGet包将在Unity包管理器的“My Registries”部分中不可见，但仍可在“In Project”部分中可见。
- Unity控制台可能会警告“搜索包时出错”。
- 以上问题将来会逐步解决。

## 使用Uplinked UnityNuGet

请参阅包含以下内容的演示项目：[https://github.com/favoyang/com.example.nuget-consumer](https://github.com/favoyang/com.example.nuget-consumer)

- 安装依赖于UnityNuGet的OpenUPM包。
- 通过禁用“Assembly Version Validation”来解决潜在的版本验证问题。

## 直接使用UnityNuGet

通过设置UnityNuGet软件包仓库并锁定`org.nuget`作用域可以代替OpenUPM的Uplink功能。

```json
{
  "scopedRegistries": [
    {
      "name": "Unity NuGet",
      "url": "https://unitynuget-registry.azurewebsites.net",
      "scopes": [
        "org.nuget"
      ]
    }
    , ...
  ],
}
```

## 列出所有UnityNuGet包

查看[GitHub 列表](https://github.com/xoofx/UnityNuGet/blob/master/registry.json)， 或使用[`/-/all` API接口](https://unitynuget-registry.azurewebsites.net/-/all)：

```sh
$ curl -s https://unitynuget-registry.azurewebsites.net/-/all | json -k
```
