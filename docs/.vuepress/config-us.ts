// Configuration for region us (lang en-US)

export const config: any = {
  lang: "en-US",
  title: "OpenUPM",
  description: "OpenUPM is a managed UPM registry with automatic build services for open-source Unity packages.",
  head: [
    ["link", { rel: "alternate", type: "application/rss+xml", href: `https://api.openupm.com/feeds/updates/rss` }],
    ["link", { rel: "alternate", type: "application/rss+atom", href: `https://api.openupm.com/feeds/updates/atom` }],
    ["link", { rel: "alternate", type: "application/json", href: `https://api.openupm.com/feeds/updates/json` }],
    ["meta", { name: "keywords", content: "openupm,upm,registry,unity,package,manager,open source" }],
    // GA4
    ['script', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-HBWCQ2KGQ5' }],
    ['script', {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-HBWCQ2KGQ5');"],
    // Google AdSense
    // ["script", { src: "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" }],
    // ["script", {}, '(adsbygoogle=window.adsbygoogle||[]).push({google_ad_client:"ca-pub-7925911236569822",enable_page_level_ads:true});']
  ],
};

const docSideBar = function () {
  return [
    {
      text: "User Guide",
      collapsible: true,
      children: [
        "/docs/",
        "/docs/getting-started",
        "/docs/getting-started-cli",
        "/docs/faq",
      ]
    },
    {
      text: "Package Creator Guide",
      collapsible: true,
      children: [
        "/docs/adding-upm-package",
        "/docs/adding-badge",
        "/docs/troubleshooting-build-errors",
        "/docs/modifying-upm-package",
        "/docs/reclaim-package-ownership",
        "/docs/opt-out",
        "/docs/managing-upm-project",
      ]
    },
    {
      text: "NuGet",
      collapsible: true,
      children: [
        "/nuget/"
      ]
    },
    {
      text: "Support US",
      collapsible: true,
      children: [
        "/support/",
        "/contributors/"
      ]
    },
    {
      text: "Development Guide",
      collapsible: true,
      children: ["/docs/dev/"]
    },
    {
      text: "Resources",
      collapsible: true,
      children: [
        "/docs/team",
        "/docs/terms",
        "/docs/code-of-conduct",
        "/docs/privacy"
      ]
    }
  ];
};

export const themeConfig: any = {
  domain: `https://openupm.com`,
  navbar: [
    { text: "Packages", link: "/packages/" },
    { text: "NuGet", link: "/nuget/" },
    { text: "Docs", link: "/docs/" },
    {
      text: "Support", ariaLabel: "Support Menu",
      children: [
        { text: "Support OpenUPM", link: "/support/" },
        { text: "Contributors", link: "/contributors/" }
      ]
    },
    {
      text: "Connect", ariaLabel: "Connect Menu",
      children: [
        {
          text: "GitHub",
          link: "https://github.com/openupm/openupm",
          icon: "fab fa-github",
          iconLeft: true
        },
        {
          text: "Medium",
          link: "https://medium.com/openupm",
          icon: "fab fa-medium",
          iconLeft: true
        },
        {
          text: "Twitter",
          link: "https://twitter.com/openupmupdate",
          icon: "fab fa-twitter",
          iconLeft: true
        },
        {
          text: "Discord",
          link: "https://discord.gg/FnUgWEP",
          icon: "fab fa-discord",
          iconLeft: true
        },
        {
          link: "mailto:hello@openupm.com",
          text: "Contact Us",
          icon: "fas fa-envelope",
          iconLeft: true
        },
        {
          link: "https://api.openupm.com/feeds/updates/rss",
          text: "Package Updates",
          icon: "fa fa-rss-square",
          raw: true,
          iconLeft: true
        }
      ]
    },
    {
      text: "CLI",
      link: "https://github.com/openupm/openupm-cli#openupm-cli",
      icon: "fa fa-keyboard",
      iconLeft: true
    },
    {
      text: "Region",
      ariaLabel: "Region Menu",
      children: [
        { text: "Global", link: "/" },
        { text: "China/中文区", link: "https://openupm.cn" }
      ]
    }
  ],
  sidebar: {
    "/docs/": docSideBar(),
    "/nuget/": docSideBar(),
    "/support/": docSideBar(),
    "/contributors/": docSideBar(),
  },
};

export default { config, themeConfig };