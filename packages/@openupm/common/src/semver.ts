// Semver util.

import { clean } from 'semver';

// Finds the start of a version-like pattern (X.Y.Z...) within a string.
// Validation is delegated to semver.clean() rather than encoded in the regex.
const SEMVER_RE = /v?\d+\.\d+\.\d+[^\s]*/i;

// Get version from git tag name.
export function getVersionFromTag(tag: string): string | null {
  // Strip upm/master suffix.
  tag = tag.replace(/(_|-)(upm|master)$/i, '');
  // Try the full string first (handles v-prefix, loose versions like 0.10.7b).
  const direct = clean(tag.toLowerCase(), { loose: true });
  if (direct) return direct;
  // Scan for a semver pattern within the string, supporting arbitrary prefix
  // characters including '@', '/', '-', and '_'.
  const match = tag.match(SEMVER_RE);
  return match ? clean(match[0].toLowerCase(), { loose: true }) : null;
}
