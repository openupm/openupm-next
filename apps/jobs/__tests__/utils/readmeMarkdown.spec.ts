import { describe, expect, it } from 'vitest';

import {
  convertToGitHubRawUrl,
  parseTitle,
  postProcessHtml,
  renderLegacyMarkdownToHtml,
  renderMarkdownToHtml,
  TRANSPARENT_PIXEL_SRC,
} from '../../src/utils/readmeMarkdown.js';

const pkg = {
  name: 'com.test.package',
  displayName: 'Test Package',
  description: 'Package description',
  repo: 'openupm/test-package',
  repoUrl: 'https://github.com/openupm/test-package',
  readme: 'main:README.md',
  readmeBranch: 'main',
};

describe('readmeMarkdown', () => {
  describe('convertToGitHubRawUrl', () => {
    it('keeps non-GitHub URLs unchanged', () => {
      expect(convertToGitHubRawUrl('https://example.com')).toBe(
        'https://example.com',
      );
    });

    it('converts GitHub blob URLs to raw URLs', () => {
      expect(
        convertToGitHubRawUrl(
          'https://github.com/openupm/openupm/blob/upm/package.json',
        ),
      ).toBe('https://github.com/openupm/openupm/raw/upm/package.json');
    });
  });

  describe('parseTitle', () => {
    it('keeps existing top-level headings', () => {
      expect(parseTitle({ pkg, markdown: '# Existing' })).toBe('# Existing');
      expect(parseTitle({ pkg, markdown: 'Existing\n=====' })).toBe(
        'Existing\n=====',
      );
      expect(parseTitle({ pkg, markdown: '<h1>Existing</h1>' })).toBe(
        '<h1>Existing</h1>',
      );
    });

    it('uses display name fallback for empty README content', () => {
      expect(parseTitle({ pkg, markdown: '' })).toBe(`# Test Package

Package description

See more in the [openupm/test-package](https://github.com/openupm/test-package) repository.
`);
    });
  });

  describe('postProcessHtml', () => {
    it('adds placeholder src for images without src', () => {
      expect(postProcessHtml('<img>', { imageBaseRelativeUrl: '/' })).toBe(
        `<div><img src="${TRANSPARENT_PIXEL_SRC}"></div>`,
      );
    });

    it('adds placeholder src for self-closing images without src', () => {
      expect(postProcessHtml('<img />', { imageBaseRelativeUrl: '/' })).toBe(
        `<div><img src="${TRANSPARENT_PIXEL_SRC}"></div>`,
      );
    });

    it('rewrites relative image src attributes', () => {
      expect(
        postProcessHtml("<img src='/img/test.png'>", {
          imageBaseRelativeUrl: 'https://example.com',
        }),
      ).toBe('<div><img src="https://example.com/img/test.png"></div>');
    });
  });

  describe('renderMarkdownToHtml', () => {
    it('renders markdown locally', () => {
      expect(
        renderMarkdownToHtml({
          pkg,
          markdown: '# title',
          disableTitleParser: true,
        }),
      ).toContain('<h1>title</h1>');
    });

    it('rewrites relative links against the README branch', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: '[link](path-1)',
        disableTitleParser: true,
      });
      expect(html).toContain(
        'href="https://github.com/openupm/test-package/blob/main/path-1"',
      );
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('rewrites relative links against a custom README directory', () => {
      const html = renderMarkdownToHtml({
        pkg: {
          ...pkg,
          readme: 'upm:.github/README.md',
          readmeBranch: 'upm',
        },
        markdown: '[link](path-1)',
        disableTitleParser: true,
      });
      expect(html).toContain(
        'href="https://github.com/openupm/test-package/blob/upm/.github/path-1"',
      );
    });

    it('preserves absolute and custom protocol links', () => {
      for (const url of [
        'http://example.com',
        'unityhub://2021.1.19f1/5f5eb8bbdc25',
        'com.unity3d.kharma:content/163802',
        'mailto:openupm@example.com',
      ]) {
        expect(
          renderMarkdownToHtml({
            pkg,
            markdown: `[link](${url})`,
            disableTitleParser: true,
          }),
        ).toContain(`href="${url}"`);
      }
    });

    it('rewrites relative images against the README branch and directory', () => {
      expect(
        renderMarkdownToHtml({
          pkg: {
            ...pkg,
            readme: 'upm:.github/README.md',
            readmeBranch: 'upm',
          },
          markdown: '![image](path-1.png)',
          disableTitleParser: true,
        }),
      ).toContain(
        'src="https://github.com/openupm/test-package/raw/upm/.github/path-1.png"',
      );
    });

    it('converts GitHub blob image URLs to raw URLs', () => {
      expect(
        renderMarkdownToHtml({
          pkg,
          markdown:
            '![image](https://github.com/openupm/test-package/blob/main/image.png)',
          disableTitleParser: true,
        }),
      ).toContain(
        'src="https://github.com/openupm/test-package/raw/main/image.png"',
      );
    });

    it('renders emoji and highlighted code with compatible local output', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: ':muscle:\n\n```js\nconst x = 1;\n```',
        disableTitleParser: true,
      });
      expect(html).toContain('💪');
      expect(html).toMatch(/<code class="[^"]*\bhljs\b[^"]*\blanguage-js\b/);
      expect(html).toContain('hljs-keyword');
    });

    it('renders GitHub alert blockquotes with alert classes', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: `> [!NOTE]
> Useful information.

> [!TIP]
> Helpful advice.

> [!IMPORTANT]
> Key information.

> [!WARNING]
> Urgent information.

> [!CAUTION]
> Risk information.`,
        disableTitleParser: true,
      });

      for (const type of ['note', 'tip', 'important', 'warning', 'caution']) {
        expect(html).toContain(`markdown-alert-${type}`);
      }
      expect(html).toContain('markdown-alert-title');
      expect(html).not.toContain('[!NOTE]');
    });

    it('renders GFM tables, task lists, and strikethrough locally', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: `| Feature | Status |
| --- | --- |
| Tables | Works |

- [x] Done
- [ ] Pending

~~removed~~`,
        disableTitleParser: true,
      });

      expect(html).toContain('<table>');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
      expect(html).toContain('<del>removed</del>');
    });

    it('renders nested blockquotes separately from GitHub alerts', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: `> Outer quote
>
> > Inner quote`,
        disableTitleParser: true,
      });

      expect(html).toContain('<blockquote>');
      expect(html).toContain('Outer quote');
      expect(html).toContain('Inner quote');
      expect(html).not.toContain('markdown-alert');
    });

    it('escapes unsupported-language code fences without highlighting', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: '```madeuplang\nconst x = "<unsafe>";\n```',
        disableTitleParser: true,
      });

      expect(html).toContain('language-madeuplang');
      expect(html).toContain('unsafe');
      expect(html).not.toContain('<unsafe>');
      expect(html).not.toContain('hljs-keyword');
    });

    it('strips unsafe link protocols while preserving supported custom protocols', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: [
          '[unsafe](javascript:alert(1))',
          '[unity](unityhub://2021.1.19f1/5f5eb8bbdc25)',
          '[asset](com.unity3d.kharma:content/163802)',
        ].join('\n\n'),
        disableTitleParser: true,
      });

      expect(html).not.toContain('javascript:alert');
      expect(html).toContain('href="unityhub://2021.1.19f1/5f5eb8bbdc25"');
      expect(html).toContain('href="com.unity3d.kharma:content/163802"');
    });

    it('strips raw unsafe HTML from README markdown', () => {
      const html = renderMarkdownToHtml({
        pkg,
        markdown: `<script>alert('xss')</script>

<iframe src="https://example.com"></iframe>

<strong>safe text</strong>`,
        disableTitleParser: true,
      });

      expect(html).not.toContain('<script');
      expect(html).not.toContain('<iframe');
      expect(html).toContain('safe text');
    });

    it('keeps the legacy renderer available for before and after comparison', () => {
      const markdown = `> [!NOTE]
> Useful information.`;

      expect(
        renderLegacyMarkdownToHtml({
          pkg,
          markdown,
          disableTitleParser: true,
        }),
      ).toContain('[!NOTE]');
      expect(
        renderMarkdownToHtml({
          pkg,
          markdown,
          disableTitleParser: true,
        }),
      ).toContain('markdown-alert-note');
    });
  });
});
