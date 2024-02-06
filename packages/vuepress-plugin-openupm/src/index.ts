// Plugin adds dynamic pages for openupm.
import { groupBy } from 'lodash-es';
import { App, HeadConfig, createPage } from '@vuepress/core';
import { Page } from '@vuepress/core';
import spdx from 'spdx-license-list';

import {
  GithubUserWithScore,
  License,
  PackageMetadataLocal,
  Topic,
  BLOCKED_SCOPES_FILENAME,
  METADATA_LOCAL_LIST_FILENAME,
  SDPXLIST_FILENAME,
} from '@openupm/types';
import {
  collectPackageHuntersAndOwners,
  loadPackageNames,
  loadPackageMetadataLocal,
  loadTopics,
  loadBlockedScopes,
} from '@openupm/local-data';
import {
  getPackageNamespace,
  getLocalePackageDisplayName,
  getLocalePackageDescription,
} from '@openupm/common/build/utils.js';
import {
  getPackageDetailPagePath,
  getPackageListPagePath,
  getPackageDetailPageUrl,
} from '@openupm/common/build/urls.js';

import { writePublicGen } from './utils/write-file.js';

type Contributor = GithubUserWithScore & {
  text: string;
  abbr: string;
};

type PluginData = {
  blockedScopes: string[];
  hunters: Contributor[];
  metadataLocalList: PackageMetadataLocal[];
  metadataGroupByNamespace: Record<string, PackageMetadataLocal[]>;
  owners: Contributor[];
  sdpxList: License[];
  topicsWithAll: Topic[];
};

type VuePressPlugin = {
  name: string;
  onInitialized: (app: App) => Promise<void>;
  extendsPage: (page: Page) => Promise<void>;
  onPrepared: (app: App) => Promise<void>;
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
  return {
    blockedScopes,
    hunters,
    metadataLocalList,
    metadataGroupByNamespace,
    owners,
    sdpxList,
    topicsWithAll,
  };
})();

/**
 * Create package detail pages
 * @param app vuepress app
 */
const createDetailPages = async function (app: App): Promise<Page[]> {
  const pages: Page[] = [];
  const { metadataLocalList, topicsWithAll } = PLUGIN_DATA;
  for (const metadataLocal of metadataLocalList) {
    const displayName = getLocalePackageDisplayName(metadataLocal);
    const title = displayName
      ? `📦 ${displayName} - ${metadataLocal.name}`
      : `📦 ${metadataLocal.name}`;
    const description = getLocalePackageDescription(metadataLocal);
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
      metadataLocal: metadataLocal,
      topics: topicsWithAll.filter(
        (x) => x.slug && metadataLocal.topics.includes(x.slug),
      ),
      head: [
        [
          'link',
          {
            rel: 'canonical',
            href: getPackageDetailPageUrl(metadataLocal.name),
          },
        ],
      ] as HeadConfig[],
    };
    const pageOptions = {
      path: getPackageDetailPagePath(metadataLocal.name),
      frontmatter,
      content: '',
    };
    const page = await createPage(app, pageOptions);
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
  const { topicsWithAll } = PLUGIN_DATA;
  for (const topic of topicsWithAll) {
    // Create page
    const frontmatter = {
      layout: 'PackageListLayout',
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: '', children: [] }],
      title: topic.slug ? `Packages - ${topic.name}` : 'Packages',
      topicSlug: topic.slug,
    };
    const pageOptions = {
      path: topic.urlPath,
      frontmatter,
      content: '',
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
    addPages(app, await createListPages(app));
  },
  extendsPage: async (page: Page): Promise<void> => {
    if (page.path.endsWith('/contributors/')) {
      const { hunters, owners } = PLUGIN_DATA;
      page.frontmatter.hunters = hunters.slice(0, 100);
      page.frontmatter.owners = owners.slice(0, 100);
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
});
