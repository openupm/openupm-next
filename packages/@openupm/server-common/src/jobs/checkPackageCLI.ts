#!/usr/bin/env node
import { createCommand } from '@commander-js/extra-typings';

import { checkLicenseJob } from './checkPackageLicense.js';
import { checkReleaseJob } from './checkPackageRelease.js';

const program = createCommand();

program
  .command('license')
  .argument('[pkgs...]', 'packages that should be checked')
  .option('-a, --all', 'check all packages')
  .description('check license for given package(s)')
  .action(async function (pkgs, options) {
    const retCode = await checkLicenseCLI(pkgs, options);
    if (retCode !== 0) process.exit(retCode);
    else process.exit(0);
  });

async function checkLicenseCLI(
  packageNames: string[],
  options: Record<string, unknown>,
): Promise<number> {
  const all = options.all ? true : false;
  await checkLicenseJob(packageNames, all);
  return 0;
}

program
  .command('release')
  .argument('[pkgs...]', 'packages that should be checked')
  .option('-a, --all', 'check all packages')
  .description('check release for given package(s)')
  .action(async function (pkgs, options) {
    const retCode = await checkReleaseCLI(pkgs, options);
    if (retCode !== 0) process.exit(retCode);
    else process.exit(0);
  });

async function checkReleaseCLI(
  packageNames: string[],
  options: Record<string, unknown>,
): Promise<number> {
  const all = options.all ? true : false;
  await checkReleaseJob(packageNames, all);
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
