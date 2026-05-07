import { describe, expect, it } from 'vitest';

import { PackageMetadataLocal } from '@openupm/types';

import { renderMarkdownToHtml } from '../../src/utils/markdown.js';

const pkg: PackageMetadataLocal = {
  name: 'com.example.pkg',
  displayName: 'Example Package',
  description: 'Example description',
  repoUrl: 'https://github.com/openupm/example',
  repo: 'example',
  owner: 'openupm',
  ownerUrl: 'https://github.com/openupm',
  parentRepoUrl: null,
  parentRepo: null,
  parentOwner: null,
  parentOwnerUrl: null,
  readme: 'main:docs/README.md',
  readmeBranch: 'main',
  readmeBase: 'main/docs',
  licenseSpdxId: 'MIT',
  licenseName: 'MIT License',
  topics: [],
  hunter: 'openupm',
  hunterUrl: 'https://github.com/openupm',
  createdAt: 0,
  trackingMode: 'git',
};

describe('renderMarkdownToHtml', () => {
  it('renders README markdown with GitHub-relative links and images', async () => {
    const html = await renderMarkdownToHtml({
      pkg,
      markdown: '[Guide](guide.md)\n\n![Logo](images/logo.png)',
    });

    expect(html).toContain('<h1>Example Package</h1>');
    expect(html).toContain('https://github.com/openupm/example/blob/main/docs/guide.md');
    expect(html).toContain('https://github.com/openupm/example/raw/main/docs/images/logo.png');
  });
});
