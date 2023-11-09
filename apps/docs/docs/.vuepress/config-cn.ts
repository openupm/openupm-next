// Configuration for region us (lang zh-CN)

export const config: any = {
  lang: "zh-CN",
  title: "OpenUPM中文网",
  description: "OpenUPM是收集Unity开源软件包的仓库和自动化构建服务。",
  head: [
    ["link", { rel: "alternate", type: "application/rss+xml", href: `https://api.openupm.cn/feeds/updates/rss` }],
    ["link", { rel: "alternate", type: "application/rss+atom", href: `https://api.openupm.cn/feeds/updates/atom` }],
    ["link", { rel: "alternate", type: "application/json", href: `https://api.openupm.cn/feeds/updates/json` }],
    ["meta", { name: "keywords", content: "openupm,upm,registry,unity,package,manager,open source,开源,软件源,软件包,软件包仓库" }],
    ["script", { src: "/vendors/https-only/https-only.js" }],
    // GA4
    ['script', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-2GQ1LGF9G0' }],
    ['script', {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-2GQ1LGF9G0');"],
  ],
};

const docSideBar = function () {
  return [
    {
      text: "用户指南",
      collapsible: true,
      children: [
        "/zh/docs/",
        "/zh/docs/getting-started",
        "/zh/docs/getting-started-cli",
      ]
    },
    {
      text: "软件包作者指南",
      collapsible: true,
      children: [
        "/zh/docs/adding-upm-package",
        "/zh/docs/adding-badge",
        "/zh/docs/modifying-upm-package",
        "/zh/docs/opt-out",
        "/zh/docs/managing-upm-project",
      ]
    },
    {
      text: "NuGet",
      collapsible: true,
      children: [
        "/zh/nuget/"
      ]
    },
    {
      text: "支持我们",
      collapsible: true,
      children: [
        "/zh/support/",
        "/zh/contributors/"
      ]
    },
    {
      text: "OpenUPM维护指南",
      collapsible: true,
      children: ["/zh/docs/dev/"]
    },
    {
      text: "其他资源",
      collapsible: true,
      children: [
        "/zh/docs/team",
        "/zh/docs/terms",
        "/zh/docs/code-of-conduct",
        "/zh/docs/privacy"
      ]
    }
  ];
};

export const themeConfig: any = {
  domain: `https://openupm.cn`,
  editLinkText: "编辑此页面",
  navbar: [
    { text: "软件包", link: "/packages/" },
    { text: "NuGet", link: "/zh/nuget/" },
    { text: "文档", link: "/zh/docs/" },
    {
      text: "支持",
      children: [
        { text: "支持OpenUPM", link: "/zh/support/" },
        { text: "贡献者", link: "/zh/contributors/" }
      ]
    },
    {
      text: "社区",
      children: [
        {
          text: "GitHub",
          link:
            "https://github.com/openupm/openupm/blob/master/README.zh-cn.md",
          icon: "fab fa-github",
          iconLeft: true
        },
        {
          link: "mailto:hello@openupm.com",
          text: "联系我们",
          icon: "fas fa-envelope",
          iconLeft: true
        },
        {
          link: "https://api.openupm.cn/feeds/updates/rss",
          text: "软件包更新",
          icon: "fa fa-rss-square",
          raw: true,
          iconLeft: true
        }
      ]
    },
    {
      text: "命令行工具",
      link: "https://github.com/openupm/openupm-cli/blob/master/README.zh-cn.md#openupm-cli",
      icon: "fa fa-keyboard",
      iconLeft: true
    },
    {
      text: "区域",
      children: [
        { text: "Global/国际区", link: "https://openupm.com" },
        { text: "中文区", link: "/" }
      ]
    }
  ],
  sidebar: {
    "/docs/": docSideBar(),
    "/zh/": docSideBar(),
  },
};

export default { config, themeConfig };
