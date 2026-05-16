import type { Packument } from "@openupm/types";

export type InstallTargetKind = "stable" | "latest";

export interface InstallTarget {
  kind: InstallTargetKind;
  version: string;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function parseSemver(version: string): ParsedVersion | null {
  const match = semverPattern.exec(version);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  };
}

function compareParsedVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export function getStableVersion(versions: string[]): string | null {
  let bestVersion: string | null = null;
  let bestParsed: ParsedVersion | null = null;

  for (const version of versions) {
    const parsed = parseSemver(version);
    if (!parsed || parsed.prerelease) continue;
    if (!bestParsed || compareParsedVersions(parsed, bestParsed) > 0) {
      bestVersion = version;
      bestParsed = parsed;
    }
  }

  return bestVersion;
}

export function getInstallTargets(packument: Partial<Packument>): InstallTarget[] {
  const latest = packument["dist-tags"]?.latest;
  if (!latest) return [];

  const stable = getStableVersion(Object.keys(packument.versions || {}));
  if (stable && stable !== latest) {
    return [
      { kind: "stable", version: stable },
      { kind: "latest", version: latest },
    ];
  }

  return [{ kind: "latest", version: latest }];
}

export function getInstallCliCommand(
  packageName: string,
  explicitVersion = "",
): string {
  const installTarget = explicitVersion
    ? `${packageName}@${explicitVersion}`
    : packageName;
  return `openupm add ${installTarget}`;
}
