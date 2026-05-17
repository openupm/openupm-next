import { UNITYNUGET_REGISTRY_SNAPSHOT } from './registry-snapshot.js';

export const UNITYNUGET_REGISTRY_URL =
  'https://raw.githubusercontent.com/xoofx/UnityNuGet/master/registry.json';

export type UnityNuGetRegistryEntry = {
  listed?: boolean;
  version?: string;
  [key: string]: unknown;
};

export type UnityNuGetRegistry = Record<string, UnityNuGetRegistryEntry>;

export type UnityNuGetInventoryEntry = {
  nugetId: string;
  packageName: string;
  version: string;
};

type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}>;

export const nugetIdToOpenUpmPackageName = (nugetId: string): string =>
  `org.nuget.${nugetId.trim().toLowerCase()}`;

export const parseUnityNuGetRegistryInventory = (
  registry: unknown,
): UnityNuGetInventoryEntry[] => {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) {
    return [];
  }
  return Object.entries(registry as UnityNuGetRegistry)
    .filter(([, entry]) => entry?.listed === true)
    .map(([nugetId, entry]) => ({
      nugetId,
      packageName: nugetIdToOpenUpmPackageName(nugetId),
      version: typeof entry.version === 'string' ? entry.version : '',
    }))
    .filter((entry) => entry.nugetId.trim() && entry.version.trim())
    .sort((a, b) => a.packageName.localeCompare(b.packageName));
};

export const fetchUnityNuGetRegistryInventory = async (
  fetcher: FetchLike = fetch,
): Promise<UnityNuGetInventoryEntry[]> => {
  const resp = await fetcher(UNITYNUGET_REGISTRY_URL);
  if (!resp.ok) {
    throw new Error(
      `UnityNuGet registry fetch failed with ${resp.status} ${resp.statusText}`,
    );
  }
  return parseUnityNuGetRegistryInventory(await resp.json());
};

export const loadUnityNuGetRegistryInventory = async ({
  fetchRegistry = fetchUnityNuGetRegistryInventory,
  snapshot = UNITYNUGET_REGISTRY_SNAPSHOT,
  warn = console.warn,
}: {
  fetchRegistry?: () => Promise<UnityNuGetInventoryEntry[]>;
  snapshot?: UnityNuGetRegistry;
  warn?: (message: string) => void;
} = {}): Promise<UnityNuGetInventoryEntry[]> => {
  try {
    const liveInventory = await fetchRegistry();
    if (liveInventory.length) return liveInventory;
    warn('UnityNuGet live registry returned no listed packages; using snapshot.');
  } catch (error) {
    warn(`UnityNuGet live registry unavailable; using snapshot. ${error}`);
  }

  const snapshotInventory = parseUnityNuGetRegistryInventory(snapshot);
  if (snapshotInventory.length) return snapshotInventory;
  throw new Error(
    'UnityNuGet registry inventory is unavailable and the checked-in snapshot is empty.',
  );
};
