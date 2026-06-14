export interface BlogPost {
  title: string;
  slug: string;
  author: string;
  date: string;
  readingTime: string;
  originalUrl?: string;
  featuredImage?: string;
  excerpt: string;
}

export const BLOG_HOSTNAME = "https://openupm.com";
export const BLOG_RSS_PATH = "/blog/rss.xml";

export const BLOG_POSTS: BlogPost[] = [
  {
    title: "OpenUPM GitHub Action Publish Wait",
    slug: "openupm-github-action-publish-wait",
    author: "Favo Yang",
    date: "2026-06-14",
    readingTime: "1 min read",
    excerpt:
      "OpenUPM now has an experimental GitHub Action that can trigger a package refresh from a tag or release workflow and wait until the version is published.",
  },
  {
    title: "OpenUPM Trends Page Is Live",
    slug: "openupm-trends-page",
    featuredImage: "/images/blog-covers/openupm-trends-total-packages.png",
    author: "Favo Yang",
    date: "2026-06-11",
    readingTime: "2 min read",
    excerpt:
      "OpenUPM now has a public trends page for package growth, release activity, signing adoption, publishing modes, downloads, and topic momentum.",
  },
  {
    title: "Contributor Profile Pages Arrive on OpenUPM",
    slug: "contributor-profile-badges",
    featuredImage: "/images/blog-covers/contributor-profile-pages-and-badges.png",
    author: "Favo Yang",
    date: "2026-05-17",
    readingTime: "2 min read",
    excerpt:
      "OpenUPM now has contributor profile pages that gather package ownership, discovery activity, profile links, and badge walls into one public profile.",
  },
  {
    title: "UnityNuGet Package Pages Now on OpenUPM",
    slug: "unitynuget-package-pages-now-on-openupm",
    author: "Favo Yang",
    date: "2026-05-17",
    readingTime: "2 min read",
    excerpt:
      "OpenUPM now generates website package pages for UnityNuGet packages, making org.nuget packages easier to find, inspect, and install from the web.",
  },
  {
    title: "OpenUPM Recent Improvements, May 2026",
    slug: "openupm-recent-improvements-may-2026",
    author: "Favo Yang",
    date: "2026-05-17",
    readingTime: "3 min read",
    excerpt:
      "A short roundup of recent OpenUPM package page, build reliability, community support, and registry reliability improvements.",
  },
  {
    title: "UnityNuGet Search Now Works Through OpenUPM",
    slug: "unitynuget-search-now-works-through-openupm",
    author: "Favo Yang",
    date: "2026-05-15",
    readingTime: "1 min read",
    excerpt:
      "OpenUPM's registry upgrade experimentally makes org.nuget packages visible through registry search while keeping UnityNuGet package resolution behind the OpenUPM endpoint.",
  },
  {
    title: "OpenUPM Queue Status Page",
    slug: "openupm-queue-status-page",
    author: "Favo Yang",
    date: "2026-05-14",
    readingTime: "1 min read",
    excerpt:
      "OpenUPM now has a public queue status page for package scan and release build activity.",
  },
  {
    title: "UnityNuGet Packages Are Now Code Signed",
    slug: "unitynuget-packages-are-now-code-signed",
    author: "Favo Yang",
    date: "2026-05-13",
    readingTime: "1 min read",
    excerpt:
      "UnityNuGet packages served through OpenUPM are now code signed, with daily cache verification to keep mirrored package versions current.",
  },
  {
    title: "Signing UPM Packages with OpenUPM",
    slug: "signing-upm-packages-with-openupm",
    featuredImage: "/images/blog-signing-upm-packages-code-sign.png",
    author: "Favo Yang",
    date: "2026-05-08",
    readingTime: "3 min read",
    excerpt:
      "Unity 6.3 package signing lets package authors ship signed tarballs through GitHub Releases while OpenUPM republishes the exact artifact.",
  },
  {
    title: "OpenUPM 2025 Recap",
    slug: "openupm-2025-recap-6283fcd0217e",
    featuredImage: "/images/blog-covers/openupm-2025-recap-6283fcd0217e.png",
    author: "Favo Yang",
    date: "2026-01-02",
    readingTime: "3 min read",
    originalUrl:
      "https://medium.com/openupm/openupm-2025-recap-6283fcd0217e",
    excerpt:
      "A year-end look at OpenUPM package submissions, downloads, release activity, fast-growing packages, and the rise of AI tooling in 2025.",
  },
  {
    title: "OpenUPM Launches Alternative UnityNuGet Registry",
    slug: "openupm-launches-alternative-unitynuget-registry-0b8cc663cc41",
    featuredImage: "/images/blog-covers/openupm-launches-alternative-unitynuget-registry-0b8cc663cc41.png",
    author: "Favo Yang",
    date: "2025-03-07",
    readingTime: "2 min read",
    originalUrl:
      "https://medium.com/openupm/openupm-launches-alternative-unitynuget-registry-0b8cc663cc41",
    excerpt:
      "OpenUPM introduces an alternate UnityNuGet hosting endpoint so Unity projects can continue resolving org.nuget packages after the Azure feed shutdown.",
  },
  {
    title: "DigitalOcean Sponsorship 2024",
    slug: "digitalocean-sponsorship-2024-b015451e530b",
    author: "Favo Yang",
    date: "2025-01-13",
    readingTime: "1 min read",
    originalUrl:
      "https://medium.com/openupm/digitalocean-sponsorship-2024-b015451e530b",
    excerpt:
      "DigitalOcean continued its sponsorship of OpenUPM, providing credits that support the website and related infrastructure.",
  },
  {
    title: "Host Your First Private UPM Registry in Just 15 Minutes",
    slug: "host-your-first-private-upm-registry-in-just-15-minutes-c92d67f27de4",
    author: "Favo Yang",
    date: "2024-02-18",
    readingTime: "1 min read",
    originalUrl:
      "https://medium.com/openupm/host-your-first-private-upm-registry-in-just-15-minutes-c92d67f27de4",
    excerpt:
      "A short guide for setting up a private Unity Package Manager registry with Verdaccio and a small cloud server.",
  },
  {
    title: "OpenUPM x Hacktoberfest 2023 Round-ups",
    slug: "openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c",
    featuredImage: "/images/blog-covers/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c.jpg",
    author: "Favo Yang",
    date: "2023-11-01",
    readingTime: "3 min read",
    originalUrl:
      "https://medium.com/openupm/openupm-x-hacktoberfest-2023-round-ups-a1d968a7894c",
    excerpt:
      "A recap of OpenUPM's Hacktoberfest 2023 participation, highlighting package hunters, community submissions, and contribution activity.",
  },
  {
    title: "DigitalOcean Sponsorship 2022",
    slug: "digitalocean-sponsorship-2022-c6108c451828",
    featuredImage: "/images/blog-covers/digitalocean-sponsorship-2022-c6108c451828.png",
    author: "Favo Yang",
    date: "2022-03-22",
    readingTime: "1 min read",
    originalUrl:
      "https://medium.com/openupm/digitalocean-sponsorship-2022-c6108c451828",
    excerpt:
      "DigitalOcean renewed its service sponsorship for OpenUPM in 2022, helping cover hosting costs for the project.",
  },
  {
    title:
      "Registry Changes to Conform to .NET Standard 2.1 Shipped with Unity 2021.2",
    slug: "registry-changes-to-conform-to-net-standard-2-1-shipped-with-unity-2021-2-1e9753d49826",
    featuredImage: "/images/blog-covers/registry-changes-to-conform-to-net-standard-2-1-shipped-with-unity-2021-2-1e9753d49826.png",
    author: "Favo Yang",
    date: "2021-11-02",
    readingTime: "4 min read",
    originalUrl:
      "https://medium.com/openupm/registry-changes-to-conform-to-net-standard-2-1-shipped-with-unity-2021-2-1e9753d49826",
    excerpt:
      "Unity 2021.2 moved to .NET Standard 2.1, requiring OpenUPM and UnityNuGet cache changes for affected NuGet-derived packages.",
  },
  {
    title: "OpenUPM Uplinks to the UnityNuGet Registry",
    slug: "openupm-uplinks-to-the-unitynuget-registry-5bb235ff484e",
    featuredImage: "/images/blog-covers/openupm-uplinks-to-the-unitynuget-registry-5bb235ff484e.png",
    author: "Favo Yang",
    date: "2021-05-04",
    readingTime: "2 min read",
    originalUrl:
      "https://medium.com/openupm/openupm-uplinks-to-the-unitynuget-registry-5bb235ff484e",
    excerpt:
      "OpenUPM adds an experimental uplink to UnityNuGet so packages under the org.nuget scope can be resolved through the OpenUPM registry.",
  },
  {
    title: "DigitalOcean Sponsorship & Our Server Infrastructure",
    slug: "digitalocean-sponsorship-our-server-infrastructure-d1019b84d71c",
    featuredImage: "/images/blog-covers/digitalocean-sponsorship-our-server-infrastructure-d1019b84d71c.png",
    author: "Favo Yang",
    date: "2021-03-10",
    readingTime: "2 min read",
    originalUrl:
      "https://medium.com/openupm/digitalocean-sponsorship-our-server-infrastructure-d1019b84d71c",
    excerpt:
      "OpenUPM announces DigitalOcean sponsorship and describes the public service infrastructure at a high level.",
  },
  {
    title: "OpenUPM China Region and JD Cloud & AI Sponsorship",
    slug: "openupm-china-region-and-jd-cloud-ai-sponsorship-70ed70d44597",
    featuredImage: "/images/blog-covers/openupm-china-region-and-jd-cloud-ai-sponsorship-70ed70d44597.png",
    author: "Favo Yang",
    date: "2020-12-03",
    readingTime: "1 min read",
    originalUrl:
      "https://medium.com/openupm/openupm-china-region-and-jd-cloud-ai-sponsorship-70ed70d44597",
    excerpt:
      "OpenUPM announces the China region, sponsored by JD Cloud & AI, with localized docs, metadata, registry mirroring, and CLI support.",
  },
  {
    title: "How to Authenticate with a UPM Scoped Registry using CLI",
    slug: "how-to-authenticate-with-a-upm-scoped-registry-using-cli-afc29c13a2f8",
    featuredImage: "/images/blog-covers/how-to-authenticate-with-a-upm-scoped-registry-using-cli-afc29c13a2f8.jpg",
    author: "Favo Yang",
    date: "2020-08-02",
    readingTime: "4 min read",
    originalUrl:
      "https://medium.com/openupm/how-to-authenticate-with-a-upm-scoped-registry-using-cli-afc29c13a2f8",
    excerpt:
      "A practical walkthrough of using openupm-cli to write Unity scoped registry authentication into .upmconfig.toml.",
  },
  {
    title: "Unity Package Manager 2020.1 Round-up",
    slug: "unity-package-manager-2020-1-round-up-54a1d32c60fc",
    featuredImage: "/images/blog-covers/unity-package-manager-2020-1-round-up-54a1d32c60fc.png",
    author: "Favo Yang",
    date: "2020-07-29",
    readingTime: "4 min read",
    originalUrl:
      "https://medium.com/openupm/unity-package-manager-2020-1-round-up-54a1d32c60fc",
    excerpt:
      "Unity 2020.1 updates Package Manager UI, package source filters, scoped registry auth, Git package subfolders, and package-lock.json.",
  },
  {
    title: "How to Maintain UPM Package Part 4: Managing Package Release with CLI",
    slug: "how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163",
    featuredImage: "/images/blog-covers/how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163.png",
    author: "Favo Yang",
    date: "2020-05-31",
    readingTime: "3 min read",
    originalUrl:
      "https://medium.com/openupm/how-to-maintain-upm-package-part-4-managing-package-release-with-cli-972ff5311163",
    excerpt:
      "The fourth package maintenance article covers release-it as a CLI-driven alternative for authors who prefer controlled releases.",
  },
  {
    title: "OpenUPM Round-up",
    slug: "openupm-round-up-72796259b288",
    featuredImage: "/images/blog-covers/openupm-round-up-72796259b288.png",
    author: "Favo Yang",
    date: "2020-05-10",
    readingTime: "4 min read",
    originalUrl: "https://medium.com/openupm/openupm-round-up-72796259b288",
    excerpt:
      "A 2020 OpenUPM progress update covering package counts, package hunters, pending labels, RSS feeds, layout changes, sorting, and README support.",
  },
  {
    title: "How to Maintain UPM Package Part 3: Managing a Forked Repository",
    slug: "how-to-maintain-upm-package-part-3-2d08294269ad",
    featuredImage: "/images/blog-covers/how-to-maintain-upm-package-part-3-2d08294269ad.png",
    author: "Favo Yang",
    date: "2020-04-18",
    readingTime: "3 min read",
    originalUrl:
      "https://medium.com/openupm/how-to-maintain-upm-package-part-3-2d08294269ad",
    excerpt:
      "The third package maintenance article explains how to manage forked repositories, sync upstream changes, and preserve useful versioning.",
  },
  {
    title: "How to Maintain UPM Package Part 2: Automating Releases with GitHub Actions",
    slug: "how-to-maintain-upm-package-part-2-f352fbf5f87c",
    featuredImage: "/images/blog-covers/how-to-maintain-upm-package-part-2-f352fbf5f87c.png",
    author: "Favo Yang",
    date: "2020-02-01",
    readingTime: "7 min read",
    originalUrl:
      "https://medium.com/openupm/how-to-maintain-upm-package-part-2-f352fbf5f87c",
    excerpt:
      "The second package maintenance article explains semantic versioning and automated releases with semantic-release and GitHub Actions.",
  },
  {
    title: "Unity Package Manager 2019.3 Round-up",
    slug: "unity-package-manager-2019-3-round-up-8a663ad06bfe",
    featuredImage: "/images/blog-covers/unity-package-manager-2019-3-round-up-8a663ad06bfe.png",
    author: "Favo Yang",
    date: "2020-01-16",
    readingTime: "3 min read",
    originalUrl:
      "https://medium.com/openupm/unity-package-manager-2019-3-round-up-8a663ad06bfe",
    excerpt:
      "Unity 2019.3 brought package tarball installation, Git URL installation, Package Manager asset views, and delayed authoring features.",
  },
  {
    title: "How to Maintain UPM Package Part 1",
    slug: "how-to-maintain-upm-package-part-1-7b4daf88d4c4",
    featuredImage: "/images/blog-covers/how-to-maintain-upm-package-part-1-7b4daf88d4c4.png",
    author: "Favo Yang",
    date: "2020-01-14",
    readingTime: "6 min read",
    originalUrl:
      "https://medium.com/openupm/how-to-maintain-upm-package-part-1-7b4daf88d4c4",
    excerpt:
      "The first package maintenance article compares UPM repository layouts and shows how to create an upm branch with GitHub Actions.",
  },
  {
    title: "OpenUPM Beta is Now Available",
    slug: "openupm-beta-is-now-available-a6665ff60c71",
    featuredImage: "/images/blog-covers/openupm-beta-is-now-available-a6665ff60c71.png",
    author: "Favo Yang",
    date: "2019-12-29",
    readingTime: "2 min read",
    originalUrl:
      "https://medium.com/openupm/openupm-beta-is-now-available-a6665ff60c71",
    excerpt:
      "The original OpenUPM beta announcement describes the managed registry, automatic build pipelines, open package submission model, and early goals.",
  },
];

export const getBlogPostUrl = (slug: string): string => `/blog/${slug}/`;

export const getAbsoluteBlogPostUrl = (slug: string): string =>
  `${BLOG_HOSTNAME}${getBlogPostUrl(slug)}`;

export const getBlogPostsNewestFirst = (): BlogPost[] =>
  [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

export const getBlogPostsOldestFirst = (): BlogPost[] =>
  [...BLOG_POSTS].sort((a, b) => a.date.localeCompare(b.date));

export const getAdjacentBlogPosts = (
  slug: string,
): { previous?: BlogPost; next?: BlogPost } => {
  const posts = getBlogPostsOldestFirst();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) return {};
  return {
    previous: posts[index - 1],
    next: posts[index + 1],
  };
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const generateBlogRss = (): string => {
  const items = getBlogPostsNewestFirst()
    .map((post) => {
      const url = getAbsoluteBlogPostUrl(post.slug);
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${new Date(`${post.date}T00:00:00.000Z`).toUTCString()}</pubDate>`,
        `      <dc:creator>${escapeXml(post.author)}</dc:creator>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    "    <title>OpenUPM Blog</title>",
    "    <description>OpenUPM project updates, package manager notes, and Unity package publishing guides.</description>",
    `    <link>${BLOG_HOSTNAME}/blog/</link>`,
    `    <lastBuildDate>${new Date(`${BLOG_POSTS[0].date}T00:00:00.000Z`).toUTCString()}</lastBuildDate>`,
    "    <language>en-US</language>",
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");
};
