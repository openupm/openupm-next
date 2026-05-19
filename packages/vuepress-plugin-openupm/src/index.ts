// Plugin adds dynamic pages for openupm.
import { groupBy } from 'lodash-es';
import { App, createPage } from '@vuepress/core';
import { Page } from '@vuepress/core';
import { fs, path } from '@vuepress/utils';
import spdx from 'spdx-license-list';

import {
  GithubUserWithScore,
  License,
  PackageMetadataLocal,
  Topic,
  BLOCKED_SCOPES_FILENAME,
  METADATA_LOCAL_LIST_FILENAME,
  PackageRelease,
  SDPXLIST_FILENAME,
} from '@openupm/types';
import {
  collectPackageHuntersAndOwners,
  getLocalDataDir,
  loadPackageNames,
  loadPackageMetadataLocal,
  loadTopics,
  loadBlockedScopes,
} from '@openupm/local-data';
import {
  getPackageNamespace,
} from '@openupm/common/build/utils.js';
import {
  getContributorProfilePagePath,
  getPackageDetailPagePath,
  getPackageListPagePath,
} from '@openupm/common/build/urls.js';

import {
  addContributorProfileUrls,
  buildContributorProfile,
  collectContributorProfileGithubUsers,
  ContributorBacker,
} from './contributors.js';
import {
  buildPackageAliasRedirects,
  mergePackageAliasRedirects,
} from './redirects.js';
import {
  loadUnityNuGetRegistryInventory,
  UnityNuGetInventoryEntry,
} from './unitynuget/registry.js';
import { writePublicGen } from './utils/write-file.js';
import {
  buildCrawlablePackageSummaries,
  buildPackageDetailContent,
  buildPackageDetailDescription,
  buildPackageDetailTitle,
  buildPackageListContent,
  buildPackageListDescription,
  buildPackageListTitle,
  buildPackageStructuredData,
  buildRelatedPackageSummaryIndex,
  buildUnityNuGetStructuredData,
  getLatestPackageLastModified,
  getPackageLastModified,
  OPENUPM_FALLBACK_IMAGE,
  structuredDataHead,
} from './seo.js';

type Contributor = GithubUserWithScore & {
  text: string;
  abbr: string;
};

type PluginData = {
  blockedScopes: string[];
  contributorProfileGithubUsers: string[];
  hunters: Contributor[];
  packageLastModifiedMap: Record<string, number | undefined>;
  metadataLocalList: PackageMetadataLocal[];
  metadataGroupByNamespace: Record<string, PackageMetadataLocal[]>;
  owners: Contributor[];
  sdpxList: License[];
  topicsWithAll: Topic[];
  unityNuGetInventory: UnityNuGetInventoryEntry[];
};

const loadPackageLastModifiedMap = async (
  packageNames: string[],
): Promise<Record<string, number | undefined>> => {
  const releasesDir = path.resolve(getLocalDataDir(), 'packages-releases');
  const entries = await Promise.all(
    packageNames.map(async (packageName) => {
      try {
        const releasesPath = path.resolve(releasesDir, `${packageName}.json`);
        if (!(await fs.pathExists(releasesPath)))
          return [packageName, undefined];
        const packageInfo = JSON.parse(
          await fs.readFile(releasesPath, 'utf8'),
        ) as {
          releases?: PackageRelease[];
        };
        const latestReleaseUpdatedAt = Math.max(
          ...(packageInfo.releases || []).map(
            (release) => release.updatedAt || 0,
          ),
        );
        return [
          packageName,
          Number.isFinite(latestReleaseUpdatedAt) && latestReleaseUpdatedAt > 0
            ? latestReleaseUpdatedAt
            : undefined,
        ];
      } catch {
        return [packageName, undefined];
      }
    }),
  );
  return Object.fromEntries(entries);
};

type VuePressPlugin = {
  name: string;
  onInitialized: (app: App) => Promise<void>;
  extendsPage: (page: Page) => Promise<void>;
  onPrepared: (app: App) => Promise<void>;
  onGenerated: (app: App) => Promise<void>;
};

/**
 * Plugin data.
 * Prepare plugin data (requires target>=ES2017 to allow await on top level)
 */
const PLUGIN_DATA = await (async (): Promise<PluginData> => {
  // Load packages metadata local list.
  const packageNames = await loadPackageNames({ sortKey: 'name' });
  const metadataLocalList = (
    await Promise.all(packageNames.map(loadPackageMetadataLocal))
  ).filter((x) => x) as PackageMetadataLocal[];
  const packageLastModifiedMap = await loadPackageLastModifiedMap(packageNames);
  // Group package metadata by namespace.
  const metadataGroupByNamespace = groupBy(metadataLocalList, (x) =>
    getPackageNamespace(x.name),
  );
  // Load topics.
  const rawTopics = await loadTopics();
  const topicsWithAll: Topic[] = [
    {
      name: 'All',
      slug: '',
      keywords: [] as string[],
      urlPath: getPackageListPagePath(),
    },
  ].concat(
    rawTopics.map((x) => {
      return {
        ...x,
        urlPath: getPackageListPagePath(x.slug),
      };
    }),
  );
  // Collect package hunters and owners.
  const huntersAndOwners =
    await collectPackageHuntersAndOwners(metadataLocalList);
  const prepareContributors = (
    contributors: GithubUserWithScore[],
  ): Contributor[] => {
    return contributors.map((x) => {
      return {
        ...x,
        text: `${x.githubUser} (${x.score})`,
        abbr: x.githubUser.slice(0, 2).toUpperCase(),
      };
    });
  };
  const hunters = prepareContributors(huntersAndOwners.hunters);
  const owners = prepareContributors(huntersAndOwners.owners);
  const contributorProfileGithubUsers = collectContributorProfileGithubUsers(
    huntersAndOwners.hunters,
    huntersAndOwners.owners,
  );
  // Blocked scopes
  const blockedScopes = await loadBlockedScopes();
  // Spdx
  const sdpxList = Object.keys(spdx)
    .sort(function (a, b) {
      return spdx[a].name
        .toLowerCase()
        .localeCompare(spdx[b].name.toLowerCase());
    })
    .map(function (key) {
      return { id: key, name: spdx[key].name } as License;
    });
  const unityNuGetInventory = await loadUnityNuGetRegistryInventory();
  return {
    blockedScopes,
    contributorProfileGithubUsers,
    hunters,
    packageLastModifiedMap,
    metadataLocalList,
    metadataGroupByNamespace,
    owners,
    sdpxList,
    topicsWithAll,
    unityNuGetInventory,
  };
})();

/**
 * Create contributor profile pages
 * @param app vuepress app
 */
const createContributorProfilePages = async function (
  app: App,
): Promise<Page[]> {
  const pages: Page[] = [];
  const { contributorProfileGithubUsers, hunters, metadataLocalList, owners } =
    PLUGIN_DATA;
  const contributorsPage = app.pages.find((page) =>
    page.path.endsWith('/contributors/'),
  );
  const contributorsFrontmatter = contributorsPage?.frontmatter;
  const rawBackers = contributorsFrontmatter
    ? contributorsFrontmatter.backers
    : undefined;
  const backers = Array.isArray(rawBackers)
    ? (rawBackers as ContributorBacker[])
    : [];
  const buildDate = new Date();
  for (const githubUser of contributorProfileGithubUsers) {
    const profile = buildContributorProfile(githubUser, metadataLocalList, {
      backers,
      buildDate,
      hunters,
      owners,
    });
    const frontmatter = {
      layout: 'ContributorProfileLayout',
      sidebar: false,
      title: `${githubUser} | OpenUPM Contributor`,
      description: `OpenUPM packages owned and discovered by ${githubUser}.`,
      contributorProfile: profile,
    };
    const pageOptions = {
      path: getContributorProfilePagePath(githubUser),
      frontmatter,
      content: '',
    };
    const page = await createPage(app, pageOptions);
    pages.push(page);
  }
  return pages;
};

/**
 * Create package detail pages
 * @param app vuepress app
 */
const createDetailPages = async function (app: App): Promise<Page[]> {
  const pages: Page[] = [];
  const { metadataLocalList, packageLastModifiedMap, topicsWithAll } =
    PLUGIN_DATA;
  const getRelatedPackageSummaries =
    buildRelatedPackageSummaryIndex(metadataLocalList);
  for (const metadataLocal of metadataLocalList) {
    const topics = topicsWithAll.filter(
      (x) => x.slug && metadataLocal.topics.includes(x.slug),
    );
    const title = buildPackageDetailTitle(metadataLocal);
    const description = buildPackageDetailDescription(metadataLocal);
    const cover = metadataLocal.image;
    const author = metadataLocal.owner;
    const tags = metadataLocal.topics;
    const frontmatter = {
      layout: 'PackageDetailLayout',
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: '', children: [] }],
      title,
      description,
      cover,
      author,
      tags,
      head: structuredDataHead(
        buildPackageStructuredData(metadataLocal, topics),
      ),
      lastmod: getPackageLastModified(metadataLocal, packageLastModifiedMap),
      metadataLocal: metadataLocal,
      topics,
    };
    const pageOptions = {
      path: getPackageDetailPagePath(metadataLocal.name),
      frontmatter,
      content: buildPackageDetailContent(metadataLocal, {
        relatedPackages: getRelatedPackageSummaries(metadataLocal),
        topics,
      }),
    };
    const page = await createPage(app, pageOptions);
    pages.push(page);
  }
  return pages;
};

/**
 * Create UnityNuGet package detail pages.
 * @param app vuepress app
 */
const createUnityNuGetDetailPages = async function (app: App): Promise<Page[]> {
  const pages: Page[] = [];
  for (const entry of PLUGIN_DATA.unityNuGetInventory) {
    const frontmatter = {
      layout: 'NuGetPackageDetailLayout',
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: '', children: [] }],
      title: `${entry.nugetId} | ${entry.packageName} | UnityNuGet Package | Unity Package Manager (UPM)`,
      description: `${entry.nugetId} is available as ${entry.packageName} through the OpenUPM registry UnityNuGet uplink.`,
      cover: OPENUPM_FALLBACK_IMAGE,
      head: structuredDataHead(buildUnityNuGetStructuredData(entry)),
      packageKind: 'unitynuget',
      name: entry.packageName,
      nugetId: entry.nugetId,
      unityNuGetVersion: entry.version,
    };
    const page = await createPage(app, {
      path: getPackageDetailPagePath(entry.packageName),
      frontmatter,
      content: '',
    });
    pages.push(page);
  }
  return pages;
};

/**
 * Create package list pages
 * @param app vuepress app
 */
const createListPages = async function (app: App): Promise<Page[]> {
  const pages: Page[] = [];
  const { metadataLocalList, packageLastModifiedMap, topicsWithAll } =
    PLUGIN_DATA;
  for (const topic of topicsWithAll) {
    const topicMetadataLocalList = metadataLocalList.filter((metadataLocal) =>
      topic.slug ? metadataLocal.topics.includes(topic.slug) : true,
    );
    const crawlablePackageSummaries = buildCrawlablePackageSummaries(
      topic,
      topicMetadataLocalList,
    );
    // Create page
    const frontmatter = {
      layout: 'PackageListLayout',
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: '', children: [] }],
      title: buildPackageListTitle(topic),
      description: buildPackageListDescription(topic),
      lastmod: getLatestPackageLastModified(
        topicMetadataLocalList,
        packageLastModifiedMap,
      ),
      topicSlug: topic.slug,
    };
    const pageOptions = {
      path: topic.urlPath,
      frontmatter,
      content: buildPackageListContent(topic, crawlablePackageSummaries),
    };
    const page = await createPage(app, pageOptions);
    pages.push(page);
  }
  return pages;
};

/**
 * Add pages to vuepress app
 * @param app vuepress app
 * @param pages pages to add
 */
const addPages = (app: App, pages: Page[]): void => {
  for (const page of pages) app.pages.push(page);
};

export default (): VuePressPlugin => ({
  name: 'vuepress-plugin-openupm',
  async onInitialized(app: App): Promise<void> {
    addPages(app, await createDetailPages(app));
    addPages(app, await createUnityNuGetDetailPages(app));
    addPages(app, await createListPages(app));
    addPages(app, await createContributorProfilePages(app));
  },
  extendsPage: async (page: Page): Promise<void> => {
    if (page.path.endsWith('/contributors/')) {
      const { contributorProfileGithubUsers, hunters, owners } = PLUGIN_DATA;
      page.frontmatter.hunters = hunters.slice(0, 100);
      page.frontmatter.owners = owners.slice(0, 100);
      if (Array.isArray(page.frontmatter.backers)) {
        page.frontmatter.backers = addContributorProfileUrls(
          page.frontmatter.backers,
          contributorProfileGithubUsers,
        );
      }
    }
  },
  onPrepared: async (app: App): Promise<void> => {
    await app.writeTemp(
      'topics.js',
      `export const topicsWithAll = ${JSON.stringify(
        PLUGIN_DATA.topicsWithAll,
      )};`,
    );
    await writePublicGen(
      app,
      METADATA_LOCAL_LIST_FILENAME,
      JSON.stringify(PLUGIN_DATA.metadataLocalList),
    );
    await writePublicGen(
      app,
      BLOCKED_SCOPES_FILENAME,
      JSON.stringify(PLUGIN_DATA.blockedScopes),
    );
    await writePublicGen(
      app,
      SDPXLIST_FILENAME,
      JSON.stringify(PLUGIN_DATA.sdpxList),
    );
    for (const namespace in PLUGIN_DATA.metadataGroupByNamespace) {
      await writePublicGen(
        app,
        `${namespace}.json`,
        JSON.stringify(PLUGIN_DATA.metadataGroupByNamespace[namespace]),
      );
    }
  },
  onGenerated: async (app: App): Promise<void> => {
    const redirectsPath = path.join(app.dir.dest(), '_redirects');
    const staticRedirects = (await fs.pathExists(redirectsPath))
      ? await fs.readFile(redirectsPath, 'utf8')
      : '';
    await fs.outputFile(
      redirectsPath,
      mergePackageAliasRedirects(
        staticRedirects,
        buildPackageAliasRedirects(PLUGIN_DATA.metadataLocalList),
      ),
    );
  },
});
