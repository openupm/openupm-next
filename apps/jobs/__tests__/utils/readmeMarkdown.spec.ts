import { describe, expect, it } from 'vitest';

import {
  convertToGitHubRawUrl,
  parseTitle,
  postProcessHtml,
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
      expect(html).toContain('class="hljs js"');
      expect(html).toContain('hljs-keyword');
    });
  });
});
