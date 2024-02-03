#!/usr/bin/env node
import { createCommand } from '@commander-js/extra-typings';

import { fetchPackageToAdAssetStoreIdsJob } from './adAssetStore.js';

const program = createCommand();

program
  .command('fetchpkg')
  .argument('[pkgs...]', 'packages that should be fetched')
  .option('-a, --all', 'fetch all packages')
  .description('fetch ad-assetstore for given packages')
  .action(async function (pkgs, options) {
    const retCode = await fetchPackageToAdAssetStoreIdsCLI(pkgs, options);
    if (retCode !== 0) process.exit(retCode);
    else process.exit(0);
  });

async function fetchPackageToAdAssetStoreIdsCLI(
  packageNames: string[],
  options: Record<string, unknown>,
): Promise<number> {
  const all = options.all ? true : false;
  await fetchPackageToAdAssetStoreIdsJob(packageNames, all);
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
