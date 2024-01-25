import { createCommand } from '@commander-js/extra-typings';

import { loadPackageNames } from '@openupm/local-data';
import { fetchAdPackageToAssetStore } from '../utils/ad.js';

const program = createCommand();

program
  .command('fetchpkg')
  .argument('[pkgs...]', 'packages that should be fetched')
  .option('-a, --all', 'fetch all packages')
  .description('fetch ad-assetstore for given packages')
  .action(async function (pkgs, options) {
    const retCode = await fetchAdPackageToAssetStoreCLI(pkgs, options);
    if (retCode !== 0) process.exit(retCode);
  });

async function fetchAdPackageToAssetStoreCLI(
  packageNames: string[],
  options: Record<string, unknown>,
): Promise<number> {
  // Check if all packages should be fetched
  if (options.all) packageNames = await loadPackageNames({ sortKey: 'name' });
  // Process each package
  for (const packageName of packageNames) {
    console.info(`fetching ad-assetstore for ${packageName}`);
    await fetchAdPackageToAssetStore(packageName);
  }
  return 0;
}

// prompt for invalid command
program.on('command:*', function () {
  console.warn(`unknown command: ${program.args.join(' ')}`);
  console.warn('see --help for a list of available commands');
  process.exit(1);
});

program.parse(process.argv);

// print help if no command is given
if (!program.args.length) program.help();
