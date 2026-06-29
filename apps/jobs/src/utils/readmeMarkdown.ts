import { posix } from 'node:path';

import hljs from 'highlight.js';
import { marked, Renderer } from 'marked';
import { emojify } from 'node-emoji';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import urlJoin from 'url-join';

export const TRANSPARENT_PIXEL_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=';

const urlWithProtocolRe = /.*:.*/i;
const githubBlobRe = /^https?:\/\/github\.com\/.*\/.*\/blob\//i;
const unsafeUrlProtocolRe = /^(?:javascript|vbscript|data):/i;

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

type HastElement = {
  type: string;
  tagName: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
};

type HastText = {
  type: string;
  value: string;
};

type ReadmeUrlContext = {
  repoUrl: string;
  linkBaseUrl: string;
  linkBaseRelativeUrl: string;
  imageBaseUrl: string;
  imageBaseRelativeUrl: string;
};

function isSafeHref(value: string): boolean {
  return !unsafeUrlProtocolRe.test(value);
}

function resolveReadmeLinkUrl(href: string, context: ReadmeUrlContext): string {
  if (href.startsWith('#')) return href;
  if (!urlWithProtocolRe.test(href)) {
    return href.startsWith('/')
      ? urlJoin(context.linkBaseUrl, href)
      : urlJoin(context.linkBaseRelativeUrl, href);
  }
  return href;
}

function resolveReadmeImageUrl(src: string, context: ReadmeUrlContext): string {
  if (!urlWithProtocolRe.test(src)) {
    return src.startsWith('/')
      ? urlJoin(context.imageBaseUrl, src)
      : urlJoin(context.imageBaseRelativeUrl, src);
  }
  return convertToGitHubRawUrl(src);
}

function linkifyRepositoryReferences(context: ReadmeUrlContext) {
  return function transformer(tree: unknown): void {
    visit(tree as never, 'text', (node: HastText, index, parent: HastElement) => {
      if (index === undefined || !parent?.children) return;
      if (['a', 'code', 'pre', 'kbd', 'samp'].includes(parent.tagName)) return;

      const referenceRe =
        /(^|[\s([{-])(?:(?<repo>[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(?<crossIssue>\d+)|#(?<issue>\d+)|@(?<mention>[A-Za-z\d](?:[A-Za-z\d-]{0,37}[A-Za-z\d])?))\b/g;
      const children: unknown[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = referenceRe.exec(node.value)) !== null) {
        const prefix = match[1] || '';
        const referenceStart = match.index + prefix.length;
        if (match.index > lastIndex) {
          children.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          });
        }
        if (prefix) {
          children.push({ type: 'text', value: prefix });
        }

        const groups = match.groups || {};
        const text = node.value.slice(referenceStart, referenceRe.lastIndex);
        let href = '';
        if (groups.repo && groups.crossIssue) {
          href = `https://github.com/${groups.repo}/issues/${groups.crossIssue}`;
        } else if (groups.issue) {
          href = urlJoin(context.repoUrl, `issues/${groups.issue}`);
        } else if (groups.mention) {
          href = `https://github.com/${groups.mention}`;
        }

        children.push({
          type: 'element',
          tagName: 'a',
          properties: {
            href,
            rel: ['noopener', 'noreferrer'],
          },
          children: [{ type: 'text', value: text }],
        });
        lastIndex = referenceRe.lastIndex;
      }

      if (children.length === 0) return;
      if (lastIndex < node.value.length) {
        children.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        });
      }
      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
}

function rewriteReadmeUrls(context: ReadmeUrlContext) {
  return function transformer(tree: unknown): void {
    visit(tree as never, 'element', (node: HastElement) => {
      const properties = node.properties || {};
      node.properties = properties;

      if (node.tagName === 'a') {
        const href = properties.href;
        if (typeof href !== 'string') return;
        const resolvedHref = resolveReadmeLinkUrl(href, context);
        if (!isSafeHref(resolvedHref)) {
          delete properties.href;
          return;
        }
        properties.href = resolvedHref;
        properties.rel = ['noopener', 'noreferrer'];
      }

      if (node.tagName === 'img') {
        const src = properties.src;
        if (typeof src !== 'string' || src === '') {
          properties.src = TRANSPARENT_PIXEL_SRC;
          return;
        }
        const resolvedSrc = resolveReadmeImageUrl(src, context);
        properties.src = unsafeUrlProtocolRe.test(resolvedSrc)
          ? TRANSPARENT_PIXEL_SRC
          : resolvedSrc;
      }
    });
  };
}

function normalizeSanitizedFootnoteIds() {
  return function transformer(tree: unknown): void {
    visit(tree as never, 'element', (node: HastElement) => {
      const properties = node.properties;
      if (!properties) return;

      const id = properties.id;
      if (typeof id === 'string') {
        properties.id = id.replace(/^user-content-user-content-/, 'user-content-');
      }

      const href = properties.href;
      if (typeof href === 'string' && href.startsWith('#')) {
        properties.href = href.replace(
          /^#user-content-user-content-/,
          '#user-content-',
        );
      }
    });
  };
}

function getElementText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const value = (node as { value?: unknown }).value;
  if (typeof value === 'string') return value;
  const children = (node as { children?: unknown[] }).children || [];
  return children.map(getElementText).join('');
}

function slugifyGithubHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function addHeadingIds() {
  return function transformer(tree: unknown): void {
    const counts = new Map<string, number>();
    visit(tree as never, 'element', (node: HastElement) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;

      const properties = node.properties || {};
      if (typeof properties.id === 'string' && properties.id) return;

      const baseId = slugifyGithubHeading(getElementText(node));
      if (!baseId) return;

      const count = counts.get(baseId) || 0;
      counts.set(baseId, count + 1);
      node.properties = {
        ...properties,
        id: count === 0 ? baseId : `${baseId}-${count}`,
      };
    });
  };
}

const readmeSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [
      ...(defaultSchema.protocols?.href || []),
      'com.unity3d.kharma',
      'unityhub',
    ],
    src: [
      ...(defaultSchema.protocols?.src || []),
      'data',
    ],
  },
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      ['rel', 'noopener', 'noreferrer'],
    ],
    code: [
      ...((defaultSchema.attributes?.code || []).filter(attribute => {
        return !Array.isArray(attribute) || attribute[0] !== 'className';
      })),
      ['className', 'hljs', /^language-[\w-]+$/],
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', 'markdown-alert', /^markdown-alert-[\w-]+$/],
      ['dir', 'auto'],
    ],
    p: [
      ...(defaultSchema.attributes?.p || []),
      ['className', 'markdown-alert-title'],
      ['dir', 'auto'],
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className', /^hljs-[\w-]+$/],
    ],
    svg: [
      ['aria-hidden', 'true'],
      ['className', 'octicon'],
      ['viewBox', '0 0 16 16'],
      ['width', '16'],
      ['height', '16'],
    ],
    path: [
      ['d'],
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'svg',
    'path',
  ],
};

function buildReadmeUrlContext(
  pkg: ReadmeMarkdownPackageContext,
  readmeInfo: ReadmePathInfo,
): ReadmeUrlContext {
  return {
    repoUrl: pkg.repoUrl,
    linkBaseUrl: urlJoin(pkg.repoUrl, `blob/${readmeInfo.readmeBranch}`),
    linkBaseRelativeUrl: urlJoin(pkg.repoUrl, `blob/${readmeInfo.readmeBase}`),
    imageBaseUrl: urlJoin(pkg.repoUrl, `raw/${readmeInfo.readmeBranch}`),
    imageBaseRelativeUrl: urlJoin(pkg.repoUrl, `raw/${readmeInfo.readmeBase}`),
  };
}

function prepareMarkdown({
  pkg,
  markdown,
  disableTitleParser,
}: {
  pkg: ReadmeMarkdownPackageContext;
  markdown: string;
  disableTitleParser?: boolean;
}): string {
  if (!disableTitleParser) {
    markdown = parseTitle({ pkg, markdown });
  }
  return emojify(markdown);
}

export function renderLegacyMarkdownToHtml({
  pkg,
  markdown,
  disableTitleParser,
}: {
  pkg: ReadmeMarkdownPackageContext;
  markdown: string;
  disableTitleParser?: boolean;
}): string {
  const readmeInfo = getReadmePathInfo(pkg.readme);
  markdown = prepareMarkdown({ pkg, markdown, disableTitleParser });

  const {
    linkBaseUrl,
    linkBaseRelativeUrl,
    imageBaseUrl,
    imageBaseRelativeUrl,
  } = buildReadmeUrlContext(pkg, readmeInfo);
  const renderer = createRenderer({
    linkBaseUrl,
    linkBaseRelativeUrl,
    imageBaseUrl,
    imageBaseRelativeUrl,
  });
  const html = marked.parse(markdown, { renderer }) as string;
  return postProcessHtml(html, { imageBaseRelativeUrl });
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
  const urlContext = buildReadmeUrlContext(pkg, readmeInfo);
  markdown = prepareMarkdown({ pkg, markdown, disableTitleParser });

  const html = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(() => linkifyRepositoryReferences(urlContext))
    .use(() => rewriteReadmeUrls(urlContext))
    .use(rehypeHighlight, { ignoreMissing: true } as never)
    .use(rehypeSanitize, readmeSanitizeSchema as never)
    .use(normalizeSanitizedFootnoteIds)
    .use(addHeadingIds)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();

  return `<div>${html}</div>`;
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
  return tag.replace(/\s*\/?>$/, ` src="${src}">`);
}

function replaceImageSrc(tag: string, srcAttribute: string, src: string): string {
  return tag.replace(srcAttribute, ` src="${src}"`);
}
