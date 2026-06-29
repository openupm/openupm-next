import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getReadmePathInfo,
  renderLegacyMarkdownToHtml,
  renderMarkdownToHtml,
} from '../build/utils/readmeMarkdown.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, '../tmp/readme-markdown-comparison.html');
const vuepressDataPath = resolve(
  __dirname,
  '../../docs/docs/.vuepress/readmeMarkdownDemoData.ts',
);

const syntheticPkg = {
  name: 'com.openupm.markdown-demo',
  displayName: 'OpenUPM Markdown Demo',
  description: 'Renderer comparison fixture',
  repo: 'openupm/openupm-next',
  repoUrl: 'https://github.com/openupm/openupm-next',
  readme: 'main:apps/docs/docs/docs/dev/README.md',
  readmeBranch: 'main',
};

const syntheticFixtures = [
  {
    kind: 'Synthetic',
    title: 'Core Markdown, Emoji, And Inline Code',
    pkg: syntheticPkg,
    markdown: `# Heading

Paragraph with **bold**, _emphasis_, ~~strikethrough~~, [relative link](guide.md), [anchor](#heading), GitHub emoji :rocket: :white_check_mark:, normal emoji 🚀 ✅, and \`inline code with <tag> & symbols\`.

![Relative image](../../.vuepress/public/images/openupm-icon-256.png)

- Item one
- Item two
  - Nested item

1. First
2. Second`,
  },
  {
    kind: 'Synthetic',
    title: 'GFM Table And Task List',
    pkg: syntheticPkg,
    markdown: `| Feature | Status |
| --- | --- |
| Tables | Supported |
| Task lists | Supported |

- [x] Render current package README
- [ ] Review visual diff`,
  },
  {
    kind: 'Synthetic',
    title: 'GFM Edge Cases',
    pkg: syntheticPkg,
    markdown: `## Autolink Literals

https://openupm.com/packages/

www.openupm.com

hello@example.com

## Footnotes

OpenUPM package READMEs can include footnotes.[^install-note]

[^install-note]: Footnote text with \`inline code\` and a [relative link](footnote-guide.md).

## Table Alignment And Escapes

| Left | Center | Right | Escaped pipe | Inline code |
| :--- | :---: | ---: | --- | --- |
| alpha | beta | gamma | a \\| b | \`const x = 1;\` |
| one | two | three | c \\| d | \`openupm add com.example\` |

## Nested Task List

- [x] Parent task
  - [x] Nested done task
  - [ ] Nested pending task
- [ ] Parent pending task

## Repository-Aware References

These are intentionally included to show whether local rendering turns them into links:

- Mention: @openupm
- Issue: #6635
- Cross-repo issue: openupm/openupm#6635`,
  },
  {
    kind: 'Synthetic',
    title: 'Code Blocks Across Common README Languages',
    pkg: syntheticPkg,
    markdown: [
      '```html\n<div class="package-card">OpenUPM</div>\n```',
      '```csharp\npublic sealed class Example : MonoBehaviour { }\n```',
      '```bash\nnpm run build -- --filter=@openupm/jobs\n```',
      '```sh\nopenupm add com.example.package\n```',
      '```markdown\n> [!NOTE]\n> Alert shown inside a markdown fence.\n```',
      '```js\nconst answer = 42;\nconsole.log(answer);\n```',
      '```python\nprint("openupm")\n```',
      '```java\npublic class Example { public static void main(String[] args) {} }\n```',
      '```\nplain <unsafe> text\n```',
    ].join('\n\n'),
  },
  {
    kind: 'Synthetic',
    title: 'Quotes And GitHub Alerts',
    pkg: syntheticPkg,
    markdown: `> Ordinary quote
> with a second line.

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.`,
  },
  {
    kind: 'Synthetic',
    title: 'Raw HTML, URL Rewriting, And Safety',
    pkg: syntheticPkg,
    markdown: `<p align="center">
  <a href="docs/setup.md"><img src="images/badge.png" alt="Badge"></a>
</p>

<details>
<summary>Install details</summary>

See <a href="/absolute-guide.md">absolute guide</a>.
</details>

[Unsafe link](javascript:alert(1))

[Unity Hub](unityhub://2021.1.19f1/5f5eb8bbdc25)

[Asset Store](com.unity3d.kharma:content/163802)

<script>alert('xss')</script>

<img>`,
  },
];

const liveFixtures = [
  {
    kind: 'Live README',
    title: 'OpenUPM CLI README',
    pkg: {
      name: 'com.openupm.cli-docs',
      displayName: 'OpenUPM CLI README',
      description: 'Live README sample from OpenUPM CLI',
      repo: 'openupm/openupm-cli',
      repoUrl: 'https://github.com/openupm/openupm-cli',
      readme: 'master:README.md',
      readmeBranch: 'master',
    },
    fallbackMarkdown: `# OpenUPM CLI

Install with \`npm install -g openupm-cli\`.

\`\`\`sh
openupm add com.example.package
\`\`\`

See [the repository](https://github.com/openupm/openupm-cli).`,
  },
  {
    kind: 'Live README',
    title: 'UniTask README',
    pkg: {
      name: 'com.cysharp.unitask',
      displayName: 'UniTask',
      description: 'Live README sample from Cysharp UniTask',
      repo: 'Cysharp/UniTask',
      repoUrl: 'https://github.com/Cysharp/UniTask',
      readme: 'master:README.md',
      readmeBranch: 'master',
    },
    fallbackMarkdown: `# UniTask

Provides an efficient async/await integration for Unity.

\`\`\`csharp
await UniTask.DelayFrame(1);
\`\`\`

- Supports Unity async workflows
- Includes code-heavy README examples`,
  },
  {
    kind: 'Live README',
    title: 'Unity ML-Agents README',
    pkg: {
      name: 'com.unity.ml-agents',
      displayName: 'Unity ML-Agents',
      description: 'Live README sample from Unity ML-Agents',
      repo: 'Unity-Technologies/ml-agents',
      repoUrl: 'https://github.com/Unity-Technologies/ml-agents',
      readme: 'develop:Readme.md',
      readmeBranch: 'develop',
    },
    fallbackMarkdown: `# Unity ML-Agents Toolkit

The ML-Agents toolkit has tables, links, badges, and command snippets.

\`\`\`bash
python -m pip install mlagents
\`\`\``,
  },
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function truncateMarkdown(markdown) {
  const maxLength = 120000;
  if (markdown.length <= maxLength) return markdown;
  return `${markdown.slice(0, maxLength)}

<!-- OpenUPM markdown comparison demo truncated this live README for local review. -->`;
}

function rawReadmeUrl(pkg) {
  const readmeInfo = getReadmePathInfo(pkg.readme);
  return `https://raw.githubusercontent.com/${pkg.repo}/${readmeInfo.readmeBranch}/${readmeInfo.readmePath}`;
}

async function fetchLiveMarkdown(fixture) {
  const sourceUrl = rawReadmeUrl(fixture.pkg);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(sourceUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return {
      ...fixture,
      sourceUrl,
      markdown: truncateMarkdown(await response.text()),
      fetched: true,
    };
  } catch (error) {
    return {
      ...fixture,
      sourceUrl,
      markdown: fixture.fallbackMarkdown,
      fetched: false,
      fetchError: error instanceof Error ? error.message : String(error),
    };
  }
}

function renderFixture(fixture) {
  const legacyHtml = renderLegacyMarkdownToHtml({
    pkg: fixture.pkg,
    markdown: fixture.markdown,
    disableTitleParser: true,
  });
  const currentHtml = renderMarkdownToHtml({
    pkg: fixture.pkg,
    markdown: fixture.markdown,
    disableTitleParser: true,
  });
  return {
    kind: fixture.kind,
    title: fixture.title,
    packageName: fixture.pkg.name,
    repoUrl: fixture.pkg.repoUrl,
    sourceUrl:
      fixture.kind === 'Live README'
        ? fixture.sourceUrl || rawReadmeUrl(fixture.pkg)
        : '',
    fetched: fixture.fetched,
    fetchError: fixture.fetchError,
    markdown: fixture.markdown,
    legacyHtml,
    currentHtml,
  };
}

function renderPane(content) {
  const documentHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
    body { margin: 0; padding: 1rem; }
    img { max-width: 100%; }
    pre { overflow: auto; padding: 1rem; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .markdown-alert { border-left: .25rem solid #d0d7de; margin-bottom: 1rem; padding: .5rem 1rem; }
    .markdown-alert-title { align-items: center; display: flex; font-weight: 600; gap: .45rem; margin-bottom: .45rem; }
    .markdown-alert-title svg { fill: currentColor; }
    .markdown-alert-note { border-left-color: #0969da; }
    .markdown-alert-note .markdown-alert-title { color: #0969da; }
    .markdown-alert-tip { border-left-color: #1a7f37; }
    .markdown-alert-tip .markdown-alert-title { color: #1a7f37; }
    .markdown-alert-important { border-left-color: #8250df; }
    .markdown-alert-important .markdown-alert-title { color: #8250df; }
    .markdown-alert-warning { border-left-color: #9a6700; }
    .markdown-alert-warning .markdown-alert-title { color: #9a6700; }
    .markdown-alert-caution { border-left-color: #d1242f; }
    .markdown-alert-caution .markdown-alert-title { color: #d1242f; }
  </style>
</head>
<body>${content}</body>
</html>`;
  const src = `data:text/html;base64,${Buffer.from(documentHtml).toString('base64')}`;
  return `<iframe class="rendered" sandbox="" src="${src}"></iframe>`;
}

function renderStandaloneFixture(fixture) {
  return `<section class="fixture">
    <h2>${escapeHtml(fixture.title)}</h2>
    <p><strong>${escapeHtml(fixture.kind)}</strong>${fixture.sourceUrl ? ` from <a href="${escapeHtml(fixture.sourceUrl)}">${escapeHtml(fixture.sourceUrl)}</a>` : ' generated local fixture'}</p>
    <details>
      <summary>Markdown source</summary>
      <pre><code>${escapeHtml(fixture.markdown)}</code></pre>
    </details>
    <div class="comparison">
      <article>
        <h3>Before: legacy marked renderer</h3>
        ${renderPane(fixture.legacyHtml)}
      </article>
      <article>
        <h3>After: local GFM renderer</h3>
        ${renderPane(fixture.currentHtml)}
      </article>
    </div>
  </section>`;
}

const liveMarkdownFixtures = await Promise.all(liveFixtures.map(fetchLiveMarkdown));
const renderedFixtures = [...syntheticFixtures, ...liveMarkdownFixtures].map(renderFixture);

const standaloneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenUPM README Markdown Renderer Comparison</title>
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
    body { margin: 0; padding: 2rem; }
    main { margin: 0 auto; max-width: 1200px; }
    .fixture { border-top: 1px solid #d0d7de; padding: 1.5rem 0; }
    .comparison { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    article { border: 1px solid #d0d7de; border-radius: 6px; padding: 1rem; }
    iframe.rendered { border: 0; min-height: 560px; width: 100%; }
    pre { overflow: auto; padding: 1rem; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    img { max-width: 100%; }
    @media (max-width: 760px) {
      body { padding: 1rem; }
      .comparison { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <h1>OpenUPM README Markdown Renderer Comparison</h1>
    <p>This local fallback renders the same fixture corpus through standalone iframes. Prefer the VuePress page for final visual review.</p>
    ${renderedFixtures.map(renderStandaloneFixture).join('\n')}
  </main>
</body>
</html>
`;

const vuepressData = `export type ReadmeMarkdownDemoFixture = {
  kind: string;
  title: string;
  packageName: string;
  repoUrl: string;
  sourceUrl: string;
  fetched?: boolean;
  fetchError?: string;
  markdown: string;
  legacyHtml: string;
  currentHtml: string;
};

export const readmeMarkdownDemoFixtures: ReadmeMarkdownDemoFixture[] = ${JSON.stringify(renderedFixtures, null, 2)};
`;

await mkdir(dirname(outputPath), { recursive: true });
await mkdir(dirname(vuepressDataPath), { recursive: true });
await writeFile(outputPath, standaloneHtml);
await writeFile(vuepressDataPath, vuepressData);
console.log(`Wrote ${outputPath}`);
console.log(`Wrote ${vuepressDataPath}`);
for (const fixture of renderedFixtures) {
  if (fixture.kind === 'Live README') {
    console.log(
      `${fixture.fetched ? 'Fetched' : 'Using fallback for'} ${fixture.title}: ${fixture.sourceUrl}${fixture.fetchError ? ` (${fixture.fetchError})` : ''}`,
    );
  }
}
