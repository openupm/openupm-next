// Semver util.

import { clean } from 'semver';

// Get version from git tag name.
export function getVersionFromTag(tag): string | null {
  const parseVersion = function (seg: string): string | null {
    // Handle upm suffix.
    const upmRe = /(_|-)(upm|master)$/i;
    seg = seg.replace(upmRe, '');
    return clean(seg.toLowerCase(), { loose: true });
  };
  const parseSeg = function (tag: string, separator: string): string | null {
    const segs = tag.split(separator);
    for (let i = 0; i < segs.length; i++) {
      const arr = segs.slice(segs.length - i - 1, segs.length);
      const text = arr.join(separator);
      version = parseVersion(text);
      if (version) return version;
    }
    return null;
  };
  // Try parsing the tag.
  let version = parseVersion(tag);
  // Try parsing a path-like tag: prefix/{version}.
  if (!version) version = parseSeg(tag, '/');
  // Try parsing a hyphen-joined tag: prefix-{version}.
  if (!version) version = parseSeg(tag, '-');
  // Try parsing a underscore-joined tag: prefix_{version}.
  if (!version) version = parseSeg(tag, '_');
  return version;
}
