import configRaw from 'config';

import { getCachedAvatarImageFilename } from '@openupm/common/build/utils.js';
import {
  getMonthlyDownloadsUrl,
  getPackumentUrl,
} from '@openupm/common/build/urls.js';
import {
  loadPackageMetadataLocal,
  loadPackageNames,
  packageMetadataLocalExists,
} from '@openupm/local-data';
import {
  getCachedImageFilename,
  getReadmeCacheKey,
  getRepoPushedTime,
  getImageQueryForGithubUser,
  getImageQueryForPackage,
  setReadme,
  setReadmeCacheKey,
  setReadmeHtml,
  setMonthlyDownloads,
  setParentStars,
  setRepoPushedTime,
  setRepoUnavailable,
  setRepoUpdatedTime,
  setScopes,
  setStars,
  setUnityVersion,
  setUpdatedTime,
  setVersion,
} from '@openupm/server-common/build/models/packageExtra.js';
import { addImage, getImage } from '@openupm/server-common/build/utils/media.js';
import { createLogger } from '@openupm/server-common/build/log.js';
import { withGitHubAuthorizationHeader } from '@openupm/server-common/build/utils/githubToken.js';
import { PackageMetadataLocal } from '@openupm/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const logger = createLogger('@openupm/jobs/fetchPackageExtra');

type RemoteTag = {
  name: string;
  version: string;
};

type PackageMeta = {
  'dist-tags': { latest?: string };
  versions: Record<
    string,
    {
      unity?: string;
      dependencies?: Record<string, string>;
    }
  >;
  time: Record<string, string>;
};

type DownloadCountResponse = {
  downloads?: number | Array<{ downloads?: number }>;
};

type GitHubContentResponse = {
  content?: string;
  encoding?: string;
};

type ReadmeRef = {
  ref: string;
  path: string;
  base: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, {
    headers: { Accept: 'application/json' },
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) {
    throw new Error(`request failed ${resp.status} for ${url}`);
  }
  return (await resp.json()) as T;
}

function normalizeMonthlyDownloads(result: DownloadCountResponse): number {
  const downloads = result.downloads;
  if (typeof downloads === 'number') return downloads;
  if (Array.isArray(downloads)) {
    return downloads.reduce((sum, entry) => sum + (entry.downloads || 0), 0);
  }
  return 0;
}

async function fetchPackageMeta(packageName: string): Promise<PackageMeta> {
  return await fetchJson<PackageMeta>(getPackumentUrl(packageName));
}

function getLatestVersion(pkgMeta: PackageMeta): string | null {
  if (pkgMeta['dist-tags'] && pkgMeta['dist-tags'].latest)
    return pkgMeta['dist-tags'].latest;
  const versions = Object.keys(pkgMeta.versions || {});
  return versions.length ? versions[0] : null;
}

export async function fetchExtraData(
  packageNames: string[],
  force: boolean,
): Promise<void> {
  for (const packageName of packageNames) {
    if (!packageMetadataLocalExists(packageName)) {
      logger.error({ pkg: packageName }, "package doesn't exist");
      continue;
    }

    const pkg = await loadPackageMetadataLocal(packageName);
    if (!pkg) continue;

    const repoFullName = getRepoFullName(pkg);

    await fetchPackageInfo(packageName);
    await fetchPackageScopes(packageName);
    await fetchRepoInfo(repoFullName, packageName);
    await fetchReadme(pkg, packageName, repoFullName);
    await cacheImage(packageName, force);
    await cacheAvatarImage(pkg.owner || undefined, pkg.parentOwner || undefined, pkg.hunter || undefined, force);
    await fetchPackageInstallCount(packageName);
  }
}

function getRepoFullName(pkg: PackageMetadataLocal): string {
  if (pkg.repo.includes('/')) return pkg.repo;
  return `${pkg.owner}/${pkg.repo}`;
}

export async function fetchPackageExtraJob(
  packageNames: string[] | null,
  options?: { all?: boolean; force?: boolean },
): Promise<void> {
  const all = options?.all || false;
  const force = options?.force || false;

  if (all) {
    packageNames = await loadPackageNames({ sortKey: '-mtime' });
  }
  if (!packageNames || packageNames.length === 0) return;
  await fetchExtraData(packageNames, force);
}

async function fetchPackageInfo(packageName: string): Promise<void> {
  try {
    const pkgMeta = await fetchPackageMeta(packageName);
    const version = getLatestVersion(pkgMeta);
    if (!version) return;

    const versionInfo = pkgMeta.versions[version];
    const unityVersion =
      versionInfo && /^[0-9]{4}\.[0-9]/i.test(versionInfo.unity || '')
        ? (versionInfo.unity as string)
        : '';
    await setUnityVersion(packageName, unityVersion);

    const timeStr = pkgMeta.time[version] || '';
    const time = new Date(timeStr).getTime() || 0;
    await setUpdatedTime(packageName, time);
    await setVersion(packageName, version);
  } catch (err) {
    logger.error({ err, pkg: packageName }, 'fetch package info error');
  }
}

async function fetchPackageScopes(packageName: string): Promise<void> {
  try {
    const pendingList: RemoteTag[] = [{ name: packageName, version: 'latest' }];
    const processedNames = new Set<string>();
    const scopeSet = new Set<string>();
    const cachedPackageMetas = new Map<string, PackageMeta>();

    while (pendingList.length > 0) {
      const entry = pendingList.shift() as RemoteTag;
      if (processedNames.has(entry.name)) continue;
      processedNames.add(entry.name);
      if (/com\.unity\.modules/i.test(entry.name)) continue;

      let pkgMeta = cachedPackageMetas.get(entry.name);
      if (!pkgMeta) {
        try {
          pkgMeta = await fetchPackageMeta(entry.name);
          cachedPackageMetas.set(entry.name, pkgMeta);
        } catch {
          continue;
        }
      }

      scopeSet.add(entry.name);
      let version = entry.version;
      if (!version || version === 'latest') {
        version = getLatestVersion(pkgMeta) || '';
      }
      if (!pkgMeta.versions[version]) {
        version = getLatestVersion(pkgMeta) || '';
      }
      const dependencies = pkgMeta.versions[version]?.dependencies || {};
      for (const [depName, depVersion] of Object.entries(dependencies)) {
        pendingList.push({ name: depName, version: depVersion });
      }
    }

    const scopes = Array.from(scopeSet);
    scopes.sort();
    await setScopes(packageName, scopes);
  } catch (err) {
    logger.error({ err, pkg: packageName }, 'fetch package scopes error');
  }
}

async function fetchRepoInfo(repo: string, packageName: string): Promise<void> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3.json',
    };
    const requestHeaders = withGitHubAuthorizationHeader(config, headers);

    const resp = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: requestHeaders,
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      if (resp.status === 404 || resp.status === 403) {
        await setRepoUnavailable(packageName, true);
      }
      throw new Error(`GitHub repo API failed ${resp.status}`);
    }

    const repoInfo = (await resp.json()) as {
      stargazers_count?: number;
      parent?: { stargazers_count?: number };
      pushed_at?: string;
      updated_at?: string;
    };

    await setRepoUnavailable(packageName, false);
    await setStars(packageName, repoInfo.stargazers_count || 0);
    if (repoInfo.parent) {
      await setParentStars(packageName, repoInfo.parent.stargazers_count || 0);
    }
    if (repoInfo.pushed_at) {
      await setRepoPushedTime(packageName, new Date(repoInfo.pushed_at).getTime());
    }
    if (repoInfo.updated_at) {
      await setRepoUpdatedTime(packageName, new Date(repoInfo.updated_at).getTime());
    }
  } catch (err) {
    logger.error({ err, pkg: packageName }, 'fetch stars error');
  }
}

async function fetchReadme(
  pkg: PackageMetadataLocal,
  packageName: string,
  repoFullName: string,
): Promise<void> {
  const readmePath = pkg.readme;
  if (!readmePath) return;

  try {
    const pushedTime = await getRepoPushedTime(packageName);
    const readmeCacheKey = `v0:${readmePath}:${pushedTime || 0}`;
    const prevReadmeCacheKey = await getReadmeCacheKey(packageName);
    if (readmeCacheKey === prevReadmeCacheKey) {
      logger.info({ pkg: packageName, readmePath }, 'fetchReadme cache is available');
      return;
    }

    const readmeRef = parseReadmeRef(readmePath);
    const markdown = await fetchReadmeMarkdown(repoFullName, readmeRef);
    await setReadme(packageName, markdown);
    const html = await renderReadmeMarkdown(repoFullName, readmeRef, pkg, markdown);
    await setReadmeHtml(packageName, html);
    await setReadmeCacheKey(packageName, 'en-US', readmeCacheKey);
  } catch (err) {
    logger.error({ err, pkg: packageName, readmePath }, 'fetch readme error');
  }
}

async function fetchReadmeMarkdown(
  repoFullName: string,
  readmeRef: ReadmeRef,
): Promise<string> {
  const encodedPath = readmeRef.path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const url = new URL(
    `https://api.github.com/repos/${repoFullName}/contents/${encodedPath}`,
  );
  url.searchParams.set('ref', readmeRef.ref);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  const requestHeaders = withGitHubAuthorizationHeader(config, headers);
  const resp = await fetch(url, {
    headers: requestHeaders,
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    throw new Error(`GitHub contents API failed ${resp.status}`);
  }

  const data = (await resp.json()) as GitHubContentResponse;
  if (data.encoding !== 'base64' || !data.content) return '';
  return Buffer.from(data.content, 'base64').toString('utf8');
}

function parseReadmeRef(readmePath: string): ReadmeRef {
  const separatorIndex = readmePath.indexOf(':');
  const ref = separatorIndex === -1
    ? 'main'
    : readmePath.slice(0, separatorIndex);
  const path = separatorIndex === -1
    ? readmePath
    : readmePath.slice(separatorIndex + 1);
  const dirname = path.split('/').slice(0, -1).join('/');
  return {
    ref,
    path,
    base: dirname ? `${ref}/${dirname}` : ref,
  };
}

async function renderReadmeMarkdown(
  repoFullName: string,
  readmeRef: ReadmeRef,
  pkg: PackageMetadataLocal,
  markdown: string,
): Promise<string> {
  const text = parseReadmeTitle(pkg, markdown);
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  const requestHeaders = withGitHubAuthorizationHeader(config, headers);
  const resp = await fetch('https://api.github.com/markdown', {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify({
      text,
      mode: 'gfm',
      context: repoFullName,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    throw new Error(`GitHub markdown API failed ${resp.status}`);
  }

  const html = await resp.text();
  return fixReadmeRelativeUrls(html, pkg.repoUrl, readmeRef);
}

function parseReadmeTitle(
  pkg: PackageMetadataLocal,
  markdown: string,
): string {
  const pkgName = pkg.displayName || pkg.name;
  const titleLine = `# ${pkgName}\n`;
  if (markdown) {
    if (
      !/^# /m.test(markdown) &&
      !/^===/m.test(markdown) &&
      !/^<h1/m.test(markdown)
    ) {
      return titleLine + markdown;
    }
    return markdown;
  }

  return `${titleLine}
${pkg.description}

See more in the [${pkg.owner}/${pkg.repo}](${pkg.repoUrl}) repository.
`;
}

function fixReadmeRelativeUrls(
  html: string,
  repoUrl: string,
  readmeRef: ReadmeRef,
): string {
  return html
    .replace(/<a\b[^>]*\shref=(['"])(?![a-z][a-z0-9+.-]*:|#)([^'"]+)\1[^>]*>/gi, (tag, quote, href) => {
      const replacement = href.startsWith('/')
        ? `${repoUrl}/blob/${readmeRef.ref}${href}`
        : `${repoUrl}/blob/${readmeRef.base}/${href}`;
      return tag.replace(`href=${quote}${href}${quote}`, `href=${quote}${replacement}${quote}`);
    })
    .replace(/<img(?![^>]*\ssrc=)([^>]*)>/gi, '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="$1>')
    .replace(/<img\b[^>]*\ssrc=(['"])(?![a-z][a-z0-9+.-]*:)([^'"]+)\1[^>]*>/gi, (tag, quote, src) => {
      const replacement = src.startsWith('/')
        ? `${repoUrl}/raw/${readmeRef.ref}${src}`
        : `${repoUrl}/raw/${readmeRef.base}/${src}`;
      return tag.replace(`src=${quote}${src}${quote}`, `src=${quote}${replacement}${quote}`);
    });
}

async function cacheImage(packageName: string, force: boolean): Promise<void> {
  try {
    const query = await getImageQueryForPackage(packageName);
    if (!query) return;

    const imageEntry = await getImage(
      query.imageUrl,
      query.width,
      query.height,
      query.fit,
    );

    if (!force && imageEntry && imageEntry.available) {
      logger.info({ pkg: packageName }, 'cacheImage cache is available');
      return;
    }

    await addImage(
      query.imageUrl,
      query.width,
      query.height,
      query.fit,
      config.packageExtra.image.duration,
      force,
    );
  } catch (err) {
    logger.error({ err, pkg: packageName }, 'cacheImage error');
  }
}

async function cacheAvatarImage(
  owner: string | undefined,
  parentOwner: string | undefined,
  hunter: string | undefined,
  force: boolean,
): Promise<void> {
  if (owner) await cacheAvatarImageForGithubUser(owner, force);
  if (parentOwner) await cacheAvatarImageForGithubUser(parentOwner, force);
  if (hunter) await cacheAvatarImageForGithubUser(hunter, force);
}

export async function cacheAvatarImageForGithubUser(
  username: string,
  force: boolean,
): Promise<void> {
  const avatarConfig = config.packageExtra?.avatar || {};
  for (const [sizeName, entry] of Object.entries(avatarConfig)) {
    try {
      const avatarEntry = entry as { size: number; duration: number };
      const query = await getImageQueryForGithubUser(username, avatarEntry.size);
      const imageEntry = await getImage(
        query.imageUrl,
        query.width,
        query.height,
        query.fit,
      );

      if (!force && imageEntry && imageEntry.available) {
        logger.info(
          {
            username,
            width: avatarEntry.size,
            height: avatarEntry.size,
            sizeName,
          },
          'cacheAvatarImageForGithubUser cache is available',
        );
        return;
      }

      const filename = getCachedAvatarImageFilename(username, avatarEntry.size);
      await addImage(
        query.imageUrl,
        query.width,
        query.height,
        query.fit,
        avatarEntry.duration,
        force,
        filename,
      );
    } catch (err) {
      logger.error({ err, username, sizeName }, 'cacheAvatarImageForGithubUser error');
    }
  }
}

async function fetchPackageInstallCount(packageName: string): Promise<void> {
  try {
    const result = await fetchJson<DownloadCountResponse>(
      getMonthlyDownloadsUrl(packageName),
    );
    await setMonthlyDownloads(packageName, normalizeMonthlyDownloads(result));
  } catch (err) {
    logger.error({ err, pkg: packageName }, 'fetch package install count error');
  }
}

export async function getCachedImageFilenameForPackage(
  packageName: string,
): Promise<string | null> {
  return await getCachedImageFilename(packageName);
}
