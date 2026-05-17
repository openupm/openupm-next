import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const registryUrl =
  'https://raw.githubusercontent.com/xoofx/UnityNuGet/master/registry.json';
const outputPath = resolve('src/unitynuget/registry-snapshot.ts');

const response = await fetch(registryUrl);
if (!response.ok) {
  throw new Error(
    `Failed to fetch UnityNuGet registry: ${response.status} ${response.statusText}`,
  );
}

const registry = await response.json();
const sortedRegistry = Object.fromEntries(
  Object.entries(registry).sort(([a], [b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  ),
);

const source = `export const UNITYNUGET_REGISTRY_SNAPSHOT: Record<
  string,
  { listed?: boolean; version?: string; [key: string]: unknown }
> = ${JSON.stringify(sortedRegistry, null, 2)};
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, source, 'utf8');
console.log(`Wrote ${outputPath}`);
