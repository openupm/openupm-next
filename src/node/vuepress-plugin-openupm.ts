// Plugin adds dynamic pages for openupm.
import { countBy, groupBy } from 'lodash-es';
import { createPage } from '@vuepress/core'

import { collectPackageHuntersAndOwners, loadPackageNames, loadPackageMetadataLocal, loadTopics } from '@node/local-data';
import { GithubUserWithScore, PackageMetadataLocal, Topic } from '@shared/types';
import { getPackageNamespace } from './utils/package';
import { getLocalePackageDescription, getLocalePackageDisplayName, filterMetadatabyTopicSlug } from '@shared/utils';
import { getPackageDetailPagePath, getPackageListPagePath } from '@shared/urls';

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
    count: metadataLocalList.length,
    metadataList: metadataLocalList,
  }]
    .concat(rawTopics.map(topic => {
      const topicMetadataList = metadataLocalList.filter(x => filterMetadatabyTopicSlug(x, topic.slug));
      return {
        ...topic,
        urlPath: getPackageListPagePath(topic.slug),
        count: topicMetadataList.length,
        metadataList: topicMetadataList,
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
  return { metadataLocalList, metadataGroupByNamespace, topicsWithAll, hunters, owners };
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
    // const description = getLocalePackageDescription(metadataLocal);
    const frontmatter = {
      layout: "PackageDetailLayout",
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: "", children: [] }],
      showFooter: false,
      title: displayName ? `📦 ${displayName} - ${metadataLocal.name}` : `📦 ${metadataLocal.name}`,
      metadataLocal: metadataLocal,
      relatedPackages: metadataGroupByNamespace[getPackageNamespace(metadataLocal.name)]
        .filter(x => x.name != metadataLocal.name)
        .map(x => {
          return {
            name: x.name,
            text: x.displayName || x.name,
          };
        }),
      topics: (metadataLocal.topics)
        .map(x => {
          const topic = topicsWithAll.find(topic => topic.slug == x);
          if (topic) return topic;
          else return null;
        })
        .filter(x => x)
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
    // Skip topic with no packages
    if (topic.slug && topic.count == 0) continue;
    // Create page
    const frontmatter = {
      layout: "PackageListLayout",
      // Hack: use an empty element to show sidebar
      sidebar: [{ text: "", children: [] }],
      showFooter: false,
      title: topic.slug ? `Packages - ${topic.name}` : "Packages",
      topics: topicsWithAll,
      topic,
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

export default () => ({
  name: 'vuepress-plugin-openupm',
  async onInitialized(app: any) {
    const pages = ([] as any[])
      .concat(await createDetailPages(app))
      .concat(await createListPages(app));
    for (const page of pages) {
      app.pages.push(page);
    }
  },
  extendsPage: async (page: any) => {
    if (page.path.endsWith('/contributors/')) {
      const { hunters, owners } = PLUGIN_DATA;
      page.frontmatter.hunters = hunters.slice(0, 100);
      page.frontmatter.owners = owners.slice(0, 100);
    }
  },
});

