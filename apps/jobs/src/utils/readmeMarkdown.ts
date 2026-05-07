import { posix } from 'node:path';

import hljs from 'highlight.js';
import { marked, Renderer } from 'marked';
import { emojify } from 'node-emoji';
import urlJoin from 'url-join';

export const TRANSPARENT_PIXEL_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=';

const urlWithProtocolRe = /.*:.*/i;
const githubBlobRe = /^https?:\/\/github\.com\/.*\/.*\/blob\//i;

export type ReadmeMarkdownPackageContext = {
  name: string;
  displayName?: string;
  description?: string;
  repo: string;
  repoUrl: string;
  readme?: string;
  readmeBranch: string;
};

export type ReadmePathInfo = {
  readme: string;
  readmeBranch: string;
  readmePath: string;
  readmeBase: string;
};

export function getReadmePathInfo(readme: string | undefined): ReadmePathInfo {
  const normalizedReadme = readme?.trim()
    ? readme.trim().includes(':')
      ? readme.trim()
      : `main:${readme.trim()}`
    : 'main:README.md';
  const separatorIndex = normalizedReadme.indexOf(':');
  const readmeBranch = normalizedReadme.slice(0, separatorIndex);
  const readmePath = normalizedReadme.slice(separatorIndex + 1) || 'README.md';
  const readmeDir = posix.dirname(readmePath);
  const readmeBase =
    readmeDir === '.' ? readmeBranch : posix.join(readmeBranch, readmeDir);
  return {
    readme: normalizedReadme,
    readmeBranch,
    readmePath,
    readmeBase,
  };
}

export function convertToGitHubRawUrl(url: string): string {
  if (githubBlobRe.test(url)) return url.replace(/\/blob\//, '/raw/');
  return url;
}

export function parseTitle({
  pkg,
  markdown,
}: {
  pkg: ReadmeMarkdownPackageContext;
  markdown: string;
}): string {
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
${pkg.description || ''}

See more in the [${pkg.repo}](${pkg.repoUrl}) repository.
`;
}

function createRenderer({
  linkBaseUrl,
  linkBaseRelativeUrl,
  imageBaseUrl,
  imageBaseRelativeUrl,
}: {
  linkBaseUrl: string;
  linkBaseRelativeUrl: string;
  imageBaseUrl: string;
  imageBaseRelativeUrl: string;
}): Renderer {
  const renderer = new Renderer();

  renderer.link = function (token): string {
    let href = token.href;
    if (href.startsWith('#')) {
      return `<a href="${href}">${this.parser.parseInline(token.tokens)}</a>`;
    }
    if (!urlWithProtocolRe.test(href)) {
      href = href.startsWith('/')
        ? urlJoin(linkBaseUrl, href)
        : urlJoin(linkBaseRelativeUrl, href);
    }
    return Renderer.prototype.link.call(this, {
      ...token,
      href,
    }).replace('<a ', '<a rel="noopener noreferrer" ');
  };

  renderer.image = function (token): string {
    let href = token.href;
    if (!urlWithProtocolRe.test(href)) {
      href = href.startsWith('/')
        ? urlJoin(imageBaseUrl, href)
        : urlJoin(imageBaseRelativeUrl, href);
    } else {
      href = convertToGitHubRawUrl(href);
    }
    return Renderer.prototype.image.call(this, {
      ...token,
      href,
    });
  };

  renderer.code = function (token): string {
    const language = token.lang || '';
    const validLang = Boolean(language && hljs.getLanguage(language));
    const highlighted = validLang
      ? hljs.highlight(token.text, { language }).value
      : escapeForHtml(token.text);
    return `<pre><code class="hljs ${language}">${highlighted}</code></pre>`;
  };

  return renderer;
}

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeForHtml(input: string): string {
  return input.replace(/([&<>'"])/g, char => escapeMap[char]);
}

export function renderMarkdownToHtml({
  pkg,
  markdown,
  disableTitleParser,
}: {
  pkg: ReadmeMarkdownPackageContext;
  markdown: string;
  disableTitleParser?: boolean;
}): string {
  const readmeInfo = getReadmePathInfo(pkg.readme);
  if (!disableTitleParser) {
    markdown = parseTitle({ pkg, markdown });
  }
  markdown = emojify(markdown);

  const linkBaseUrl = urlJoin(pkg.repoUrl, `blob/${readmeInfo.readmeBranch}`);
  const linkBaseRelativeUrl = urlJoin(pkg.repoUrl, `blob/${readmeInfo.readmeBase}`);
  const imageBaseUrl = urlJoin(pkg.repoUrl, `raw/${readmeInfo.readmeBranch}`);
  const imageBaseRelativeUrl = urlJoin(
    pkg.repoUrl,
    `raw/${readmeInfo.readmeBase}`,
  );
  const renderer = createRenderer({
    linkBaseUrl,
    linkBaseRelativeUrl,
    imageBaseUrl,
    imageBaseRelativeUrl,
  });
  const html = marked.parse(markdown, { renderer }) as string;
  return postProcessHtml(html, { imageBaseRelativeUrl });
}

export function postProcessHtml(
  html: string,
  { imageBaseRelativeUrl }: { imageBaseRelativeUrl: string },
): string {
  return `<div>${html}</div>`.replace(/<img\b[^>]*>/gi, tag => {
    const srcMatch = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    if (!srcMatch) return insertImageSrc(tag, TRANSPARENT_PIXEL_SRC);

    const src = srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? '';
    const rewrittenSrc = urlWithProtocolRe.test(src)
      ? src
      : urlJoin(imageBaseRelativeUrl, src);
    return replaceImageSrc(tag, srcMatch[0], rewrittenSrc);
  });
}

function insertImageSrc(tag: string, src: string): string {
  return tag.replace(/>$/, ` src="${src}">`);
}

function replaceImageSrc(tag: string, srcAttribute: string, src: string): string {
  return tag.replace(srcAttribute, ` src="${src}"`);
}
