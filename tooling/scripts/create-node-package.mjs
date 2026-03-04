import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const [targetDirArg, packageName] = process.argv.slice(2);

if (!targetDirArg || !packageName) {
  console.error(
    'Usage: npm run new:node-package -- <target-dir> <package-name>',
  );
  process.exit(1);
}

const rootDir = process.cwd();
const templateDir = path.join(rootDir, 'packages/@openupm/pkg-template');
const targetDir = path.resolve(rootDir, targetDirArg);

try {
  await stat(targetDir);
  console.error(`Refusing to overwrite existing path: ${targetDirArg}`);
  process.exit(1);
} catch (error) {
  if (error && error.code !== 'ENOENT') throw error;
}

await mkdir(path.dirname(targetDir), { recursive: true });
await cp(templateDir, targetDir, { recursive: true });

const packageJsonPath = path.join(targetDir, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
packageJson.name = packageName;
await writeFile(
  packageJsonPath,
  `${JSON.stringify(packageJson, null, 2)}\n`,
  'utf8',
);

const readmePath = path.join(targetDir, 'README.md');
await writeFile(readmePath, `# ${packageName}\n`, 'utf8');

console.log(`Created ${packageName} at ${path.relative(rootDir, targetDir)}`);
