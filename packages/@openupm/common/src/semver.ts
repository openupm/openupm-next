// Semver util.

import { clean } from 'semver';

// Finds a version-looking token inside a tag with a known tag separator, for
// example `upm/1.2.3-preview.1` or `com.example.package@1.2.3-preview.1`.
//
// The regex intentionally captures the rest of the non-space version token
// after X.Y.Z. That lets semver.clean() reject malformed suffixes such as
// `1.2.3/foo`, `1.2.3_alpha`, and `1.2.3-alpha..1` instead of accepting the
// shorter `1.2.3` prefix by accident.
const VERSION_TOKEN_RE = /(?:^|[/_@-])(v?\d+\.\d+\.\d+\S*)/i;

function stripOpenUpmSuffix(tag: string): string {
  return tag.replace(/(_|-)(upm|master)$/i, '');
}

function cleanVersionToken(token: string): string | null {
  return clean(stripOpenUpmSuffix(token).toLowerCase(), { loose: true });
}

// Get version from git tag name.
export function getVersionFromTag(tag: string): string | null {
  // Try the full string first. This handles bare versions, v-prefixes, and
  // historical loose spellings like `0.10.7b`.
  const direct = cleanVersionToken(tag);
  if (direct) return direct;

  // Scan inside a prefixed tag after direct parsing fails. The semver package
  // still owns validation and normalization of prerelease/build metadata.
  const match = tag.match(VERSION_TOKEN_RE);
  return match ? cleanVersionToken(match[1]) : null;
}
