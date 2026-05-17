import {
  loadUnityNuGetRegistryInventory,
  nugetIdToOpenUpmPackageName,
  parseUnityNuGetRegistryInventory,
} from '../src/unitynuget/registry.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pluginIndexPath = fileURLToPath(new URL('../src/index.ts', import.meta.url));

describe('UnityNuGet registry inventory', () => {
  it('normalizes NuGet IDs to org.nuget package names', () => {
    expect(nugetIdToOpenUpmPackageName('Newtonsoft.Json')).toBe(
      'org.nuget.newtonsoft.json',
    );
  });

  it('parses listed packages and excludes unlisted packages', () => {
    expect(
      parseUnityNuGetRegistryInventory({
        'Newtonsoft.Json': { listed: true, version: '13.0.4' },
        'System.Numerics.Vectors': { listed: false, version: '4.4.0' },
        MissingVersion: { listed: true },
      }),
    ).toEqual([
      {
        nugetId: 'Newtonsoft.Json',
        packageName: 'org.nuget.newtonsoft.json',
        version: '13.0.4',
      },
    ]);
  });

  it('uses the checked-in snapshot when live fetch fails', async () => {
    const warnings: string[] = [];
    await expect(
      loadUnityNuGetRegistryInventory({
        fetchRegistry: async () => {
          throw new Error('network unavailable');
        },
        snapshot: {
          Akka: { listed: true, version: '1.4.1' },
        },
        warn: (message) => warnings.push(message),
      }),
    ).resolves.toEqual([
      {
        nugetId: 'Akka',
        packageName: 'org.nuget.akka',
        version: '1.4.1',
      },
    ]);
    expect(warnings[0]).toContain('UnityNuGet live registry unavailable');
  });

  it('fails when live and snapshot inventories are both unavailable', async () => {
    await expect(
      loadUnityNuGetRegistryInventory({
        fetchRegistry: async () => [],
        snapshot: {},
        warn: () => undefined,
      }),
    ).rejects.toThrow('checked-in snapshot is empty');
  });

  it('generates NuGet pages without Markdown content headings', () => {
    const source = readFileSync(pluginIndexPath, 'utf8');

    expect(source).toContain("layout: 'NuGetPackageDetailLayout'");
    expect(source).toContain(
      '${entry.nugetId} | ${entry.packageName} | UnityNuGet Package | Unity Package Manager (UPM)',
    );
    expect(source).toContain("content: ''");
    expect(source).not.toContain('UnityNuGet package.\\n');
  });
});
