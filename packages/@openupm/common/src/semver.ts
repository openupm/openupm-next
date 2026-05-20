// Semver util.

import { clean } from 'semver';

const TAG_VERSION_SEPARATORS = ['/', '-', '_', '@'];

function stripOpenUpmSuffix(tag: string): string {
  return tag.replace(/(_|-)(upm|master)$/i, '');
}

function cleanVersionToken(token: string): string | null {
  return clean(stripOpenUpmSuffix(token).toLowerCase(), { loose: true });
}

function cleanVersionSuffix(tag: string, separator: string): string | null {
  const segments = tag.split(separator);
  for (let index = segments.length - 1; index >= 0; index--) {
    const candidate = segments.slice(index).join(separator);
    const version = cleanVersionToken(candidate);
    if (version) return version;
  }
  return null;
}

// Get version from git tag name.
export function getVersionFromTag(tag: string): string | null {
  // Try the full string first. This handles bare versions, v-prefixes, and
  // historical loose spellings like `0.10.7b`.
  const direct = cleanVersionToken(tag);
  if (direct) return direct;

  // Walk separator-delimited suffixes from right to left so tags containing
  // more than one version-looking token keep the historical terminal-version
  // behavior. semver.clean() still owns validation and normalization.
  for (const separator of TAG_VERSION_SEPARATORS) {
    const version = cleanVersionSuffix(tag, separator);
    if (version) return version;
  }
  return null;
}
