import highlightjs from 'highlight.js';
import { marked, Renderer } from 'marked';
import * as emoji from 'node-emoji';
import urlJoin from 'url-join';

import { PackageMetadataLocal } from '@openupm/types';

const urlWithProtocolRe = /.*:.*/i;

export function convertToGitHubRawUrl(url: string): string {
  const gitHubBlobRe = /^https?:\/\/github\.com\/.*\/.*\/blob\//i;
  if (gitHubBlobRe.test(url)) return url.replace(/\/blob\//, '/raw/');
  return url;
}

function escapeForHtml(input: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return input.replace(/([&<>'"])/g, (char) => escapeMap[char] || char);
}

function markedRenderer({
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
  const originalRendererLink = renderer.link.bind(renderer);
  const originalRendererImage = renderer.image.bind(renderer);

  renderer.link = ({ href, title, tokens }): string => {
    let resolvedHref = href;
    const text = renderer.parser.parseInline(tokens);
    if (resolvedHref.startsWith('#')) {
      return `<a href='${resolvedHref}'>${text}</a>`;
    }
    if (!urlWithProtocolRe.test(resolvedHref)) {
      resolvedHref = resolvedHref.startsWith('/')
        ? urlJoin(linkBaseUrl, resolvedHref)
        : urlJoin(linkBaseRelativeUrl, resolvedHref);
    }
    let link = originalRendererLink({ href: resolvedHref, title, tokens });
    link = link.replace('<a', '<a rel="noopener noreferrer"');
    return link;
  };

  renderer.image = ({ href, title, text }): string => {
    let resolvedHref = href;
    if (!urlWithProtocolRe.test(resolvedHref)) {
      resolvedHref = resolvedHref.startsWith('/')
        ? urlJoin(imageBaseUrl, resolvedHref)
        : urlJoin(imageBaseRelativeUrl, resolvedHref);
    } else {
      resolvedHref = convertToGitHubRawUrl(resolvedHref);
    }
    return originalRendererImage({ href: resolvedHref, title, text });
  };

  renderer.code = ({ text, lang }): string => {
    const language = lang || '';
    const validLang = !!(language && highlightjs.getLanguage(language));
    const highlighted = validLang
      ? highlightjs.highlight(text, { language }).value
      : escapeForHtml(text);
    return `<pre><code class="hljs ${language}">${highlighted}</code></pre>`;
  };

  return renderer;
}

export function parseTitle({
  pkg,
  markdown,
}: {
  pkg: PackageMetadataLocal;
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
${pkg.description}

See more in the [${pkg.owner}/${pkg.repo}](${pkg.repoUrl}) repository.
`;
}

export function postProcessHtml(
  html: string,
  { imageBaseRelativeUrl }: { imageBaseRelativeUrl: string },
): string {
  const transparentPixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=';
  return html
    .replace(/<img(?![^>]*\ssrc=)([^>]*)>/gi, `<img src="${transparentPixel}"$1>`)
    .replace(/<img\b[^>]*\ssrc=(['"])(?![a-z][a-z0-9+.-]*:)([^'"]+)\1[^>]*>/gi, (tag, quote, src) => {
      return tag.replace(
        `src=${quote}${src}${quote}`,
        `src=${quote}${urlJoin(imageBaseRelativeUrl, src)}${quote}`,
      );
    });
}

export async function renderMarkdownToHtml({
  pkg,
  markdown,
  disableTitleParser,
}: {
  pkg: PackageMetadataLocal;
  markdown: string;
  disableTitleParser?: boolean;
}): Promise<string> {
  let text = disableTitleParser ? markdown : parseTitle({ pkg, markdown });
  text = text.replace(/(:.*:)/g, (match) => emoji.emojify(match));

  const linkBaseUrl = urlJoin(pkg.repoUrl, `blob/${pkg.readmeBranch}`);
  const linkBaseRelativeUrl = urlJoin(pkg.repoUrl, `blob/${pkg.readmeBase}`);
  const imageBaseUrl = urlJoin(pkg.repoUrl, `raw/${pkg.readmeBranch}`);
  const imageBaseRelativeUrl = urlJoin(pkg.repoUrl, `raw/${pkg.readmeBase}`);
  const renderer = markedRenderer({
    linkBaseUrl,
    linkBaseRelativeUrl,
    imageBaseUrl,
    imageBaseRelativeUrl,
  });
  const html = marked.parse(text, { renderer, async: false });
  return postProcessHtml(html, { imageBaseRelativeUrl });
}
