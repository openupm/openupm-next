/* eslint-disable @typescript-eslint/no-explicit-any */
// Configuration for region us (lang en-US)

export const config: any = {
  lang: "en-US",
  title: "OpenUPM",
  description:
    "OpenUPM is a managed UPM registry with automatic build services for open-source Unity packages.",
  head: [
    [
      "link",
      {
        rel: "alternate",
        type: "application/rss+xml",
        href: `https://api.openupm.com/feeds/updates/rss`,
      },
    ],
    [
      "link",
      {
        rel: "alternate",
        type: "application/rss+atom",
        href: `https://api.openupm.com/feeds/updates/atom`,
      },
    ],
    [
      "link",
      {
        rel: "alternate",
        type: "application/json",
        href: `https://api.openupm.com/feeds/updates/json`,
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "openupm,open upm,upm,unity package manager,unity package,scoped registry,unity,open source,unity assets,asset store,unity store,free resource",
      },
    ],
    // GA4
    [
      "script",
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-HBWCQ2KGQ5",
      },
    ],
    [
      "script",
      {},
      "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-HBWCQ2KGQ5');",
    ],
    // Google AdSense
    [
      "script",
      {
        src: "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1509006252899759",
        crossorigin: "anonymous",
      },
    ],
    // Ad blocking recovery
    [
      "script",
      {
        async: true,
        src: "https://fundingchoicesmessages.google.com/i/pub-1509006252899759?ers=1",
        nonce: "lUc_KA2m2P9d600H2mOqjg",
      },
    ],
    [
      "script",
      { nonce: "lUc_KA2m2P9d600H2mOqjg" },
      "(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();",
    ],
    // Microsoft Clarity
    [
      "script",
      {},
      `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "og7ef5jadp");`
    ],
  ],
};

const docSideBar = function (): any {
  return [
    {
      text: "User Guide",
      collapsible: true,
      children: [
        "/docs/",
        "/docs/getting-started",
        "/docs/getting-started-cli",
        "/docs/faq",
      ],
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
      ],
    },
    {
      text: "Host Your Private Registry",
      collapsible: true,
      children: ["/docs/host-private-upm-registry-15-minutes"],
    },
    {
      text: "NuGet",
      collapsible: true,
      children: ["/nuget/"],
    },
    {
      text: "Support US",
      collapsible: true,
      children: ["/support/", "/contributors/"],
    },
    {
      text: "Development Guide",
      collapsible: true,
      children: ["/docs/dev/"],
    },
    {
      text: "Resources",
      collapsible: true,
      children: [
        "/docs/team",
        "/docs/terms",
        "/docs/code-of-conduct",
        "/docs/privacy",
      ],
    },
  ];
};

export const themeConfig: any = {
  domain: `https://openupm.com`,
  navbar: [
    { text: "Packages", link: "/packages/" },
    {
      text: "Discounts & Deals",
      link: "https://assetstore.unity.com/?on_sale=true&orderBy=1&rows=96&aid=1011lJJH",
    },
    { text: "Docs", link: "/docs/" },
    {
      text: "Support",
      ariaLabel: "Support Menu",
      children: [
        { text: "Support OpenUPM", link: "/support/" },
        { text: "Contributors", link: "/contributors/" },
      ],
    },
    {
      text: "Connect",
      ariaLabel: "Connect Menu",
      children: [
        {
          text: "GitHub",
          link: "https://github.com/openupm/openupm",
          icon: "fab fa-github",
          iconLeft: true,
        },
        {
          text: "Medium",
          link: "https://medium.com/openupm",
          icon: "fab fa-medium",
          iconLeft: true,
        },
        {
          text: "Twitter",
          link: "https://twitter.com/openupmupdate",
          icon: "fab fa-twitter",
          iconLeft: true,
        },
        {
          text: "Discord",
          link: "https://discord.gg/FnUgWEP",
          icon: "fab fa-discord",
          iconLeft: true,
        },
        {
          link: "mailto:hello@openupm.com",
          text: "Contact Us",
          icon: "fas fa-envelope",
          iconLeft: true,
        },
        {
          link: "https://api.openupm.com/feeds/updates/rss",
          text: "Package Updates",
          icon: "fa fa-rss-square",
          raw: true,
          iconLeft: true,
        },
      ],
    },
    {
      text: "CLI",
      link: "https://github.com/openupm/openupm-cli#openupm-cli",
      icon: "fa fa-keyboard",
      iconLeft: true,
    },
  ],
  sidebar: {
    "/docs/": docSideBar(),
    "/nuget/": docSideBar(),
    "/support/": docSideBar(),
    "/contributors/": docSideBar(),
  },
};

export default { config, themeConfig };
