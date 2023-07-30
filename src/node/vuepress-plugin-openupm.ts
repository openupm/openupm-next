// Plugin adds dynamic pages for openupm.
import { groupBy } from 'lodash-es';
import { createPage } from '@vuepress/core'
import spdx from 'spdx-license-list';

import { collectPackageHuntersAndOwners, loadPackageNames, loadPackageMetadataLocal, loadTopics, loadBlockedScopes } from '@node/local-data';
import { GithubUserWithScore, License, PackageMetadataLocal, Topic } from '@shared/types';
import { getPackageNamespace } from '@shared/utils';
import { getLocalePackageDisplayName } from '@shared/utils';
import { getPackageDetailPagePath, getPackageListPagePath } from '@shared/urls';
import { writePublicGen } from '@node/utils/write-public';
import { BLOCKED_SCOPES_FILENAME, METADATA_LOCAL_LIST_FILENAME, SDPXLIST_FILENAME } from '@shared/constant';

/**
 * Plugin data.
 * Prepare plugin data (requires target>=ES2017 to allow await on top level)
 */
const PLUGIN_DATA = await (async () => {
  // Load packages metadata local list.
  const packageNames = await loadPackageNames({ sortKey: "name" });
  const metadataLocalList = (await Promise.all(packageNames.map(loadPackageMetadataLocal))).filter((x) => x) as PackageMetadataLocal[];
  // Group package metadata by namespace.
  const metadataGroupByNamespace = groupBy(metadataLocalList, x => getPackageNamespace(x.name));
  // Load topics.
  const rawTopics = await loadTopics();
  const topicsWithAll: Topic[] = [{
    name: "All",
    slug: "",
    urlPath: getPackageListPagePath(),
  }].concat(rawTopics.map(x => {
    return {
      ...x,
      urlPath: getPackageListPagePath(x.slug),
    };
  }));
  // Collect package hunters and owners.
  let { hunters, owners } = await collectPackageHuntersAndOwners(metadataLocalList);
  const prepareContributors = (contributors: GithubUserWithScore[]) => {
    return contributors.map((x) => {
      return {
        ...x,
        text: `${x.githubUser} (${x.score})`,
        abbr: x.githubUser.slice(0, 2).toUpperCase(),
      };
    });
  };
  hunters = prepareContributors(hunters);
  owners = prepareContributors(owners);
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
const createDetailPages = async function (app: any) {
  const pages: any[] = [];
  const { metadataLocalList, metadataGroupByNamespace, topicsWithAll } = PLUGIN_DATA;
  for (const metadataLocal of metadataLocalList) {
    const displayName = getLocalePackageDisplayName(metadataLocal);
    const frontmatter = {
      layout: "PackageDetailLayout",
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: "", children: [] }],
      title: displayName ? `📦 ${displayName} - ${metadataLocal.name}` : `📦 ${metadataLocal.name}`,
      metadataLocal: metadataLocal,
      topics: topicsWithAll.filter(x => x.slug && metadataLocal.topics.includes(x.slug))
    };
    const pageOptions = {
      path: getPackageDetailPagePath(metadataLocal.name),
      frontmatter,
      content: ''
    };
    const page = await createPage(app, pageOptions);
    pages.push(page);
  }
  return pages;
}

/**
 * Create package list pages
 * @param app vuepress app
 */
const createListPages = async function (app: any) {
  const pages: any[] = [];
  const { topicsWithAll } = PLUGIN_DATA;
  for (const topic of topicsWithAll) {
    // Create page
    const frontmatter = {
      layout: "PackageListLayout",
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: "", children: [] }],
      title: topic.slug ? `Packages - ${topic.name}` : "Packages",
      topicSlug: topic.slug,
    };
    const pageOptions = {
      path: topic.urlPath,
      frontmatter,
      content: ''
    }
    const page = await createPage(app, pageOptions);
    pages.push(page);
  }
  return pages;
}

/**
 * Add pages to vuepress app
 * @param app vuepress app
 * @param pages pages to add
 */
const addPages = (app: any, pages: any[]) => {
  for (const page of pages)
    app.pages.push(page);
}

export default () => ({
  name: 'vuepress-plugin-openupm',
  async onInitialized(app: any) {
    addPages(app, await createDetailPages(app));
    addPages(app, await createListPages(app));
  },
  extendsPage: async (page: any) => {
    if (page.path.endsWith('/contributors/')) {
      const { hunters, owners } = PLUGIN_DATA;
      page.frontmatter.hunters = hunters.slice(0, 100);
      page.frontmatter.owners = owners.slice(0, 100);
    }
  },
  onPrepared: async (app: any) => {
    await app.writeTemp('topics.js', `export const topicsWithAll = ${JSON.stringify(PLUGIN_DATA.topicsWithAll)};`);
    await writePublicGen(app, METADATA_LOCAL_LIST_FILENAME, JSON.stringify(PLUGIN_DATA.metadataLocalList));
    await writePublicGen(app, BLOCKED_SCOPES_FILENAME, JSON.stringify(PLUGIN_DATA.blockedScopes));
    await writePublicGen(app, SDPXLIST_FILENAME, JSON.stringify(PLUGIN_DATA.sdpxList));
    for (const namespace in PLUGIN_DATA.metadataGroupByNamespace) {
      await writePublicGen(app, `${namespace}.json`, JSON.stringify(PLUGIN_DATA.metadataGroupByNamespace[namespace]));
    }
  }
});
