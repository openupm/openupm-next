// Plugin adds dynamic pages for openupm.
import { loadPackageNames, loadPackage, collectPackageHuntersAndOwners } from '@node/local-data';

// Prepare plugin data (requires ES2017)
const PLUGIN_DATA = await (async () => {
  // Load packages.
  const packageNames = await loadPackageNames({ sortKey: "name" });
  let packages = await Promise.all(packageNames.map(loadPackage));
  packages = packages.filter((x) => x);
  // Collect package hunters and owners.
  let { hunters, owners } = await collectPackageHuntersAndOwners(packages);
  const prepareContributors = (contributors) => {
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
  return { packages, hunters, owners };
})();

export default (options) => ({
  name: 'vuepress-plugin-openupm',
  extendsPage: async (page: any) => {
    if (page.path.endsWith('/contributors/')) {
      page.frontmatter.hunters = PLUGIN_DATA.hunters.slice(0, 100);
      page.frontmatter.owners = PLUGIN_DATA.owners.slice(0, 100);
    }
  },
});

