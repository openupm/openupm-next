import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  renderLegacyMarkdownToHtml,
  renderMarkdownToHtml,
} from '../build/utils/readmeMarkdown.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, '../tmp/readme-markdown-comparison.html');

const pkg = {
  name: 'com.openupm.markdown-demo',
  displayName: 'OpenUPM Markdown Demo',
  description: 'Renderer comparison fixture',
  repo: 'openupm/markdown-demo',
  repoUrl: 'https://github.com/openupm/markdown-demo',
  readme: 'main:docs/README.md',
  readmeBranch: 'main',
};

const fixtures = [
  {
    title: 'Core Markdown',
    markdown: `# Heading

Paragraph with **bold**, _emphasis_, ~~strikethrough~~, [relative link](guide.md), [anchor](#heading), and \`inline code\`.

![Relative image](images/logo.png)

- Item one
- Item two
  - Nested item

1. First
2. Second`,
  },
  {
    title: 'GFM Table And Task List',
    markdown: `| Feature | Status |
| --- | --- |
| Tables | Supported |
| Task lists | Supported |

- [x] Render current package README
- [ ] Review visual diff`,
  },
  {
    title: 'Code Blocks',
    markdown: "```js\nconst answer = 42;\nconsole.log(answer);\n```\n\n```csharp\npublic class Example {}\n```\n\n```\nplain <unsafe> text\n```",
  },
  {
    title: 'Quotes And Alerts',
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
    title: 'Safety And URL Rewriting',
    markdown: `[Unsafe link](javascript:alert(1))

[Unity Hub](unityhub://2021.1.19f1/5f5eb8bbdc25)

[Asset Store](com.unity3d.kharma:content/163802)

<script>alert('xss')</script>

<img>`,
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

function renderFixture({ title, markdown }) {
  const legacy = renderLegacyMarkdownToHtml({
    pkg,
    markdown,
    disableTitleParser: true,
  });
  const current = renderMarkdownToHtml({
    pkg,
    markdown,
    disableTitleParser: true,
  });

  return `<section class="fixture">
    <h2>${escapeHtml(title)}</h2>
    <details>
      <summary>Markdown source</summary>
      <pre><code>${escapeHtml(markdown)}</code></pre>
    </details>
    <div class="comparison">
      <article>
        <h3>Before: legacy marked renderer</h3>
        ${renderPane(legacy)}
      </article>
      <article>
        <h3>After: local GFM renderer</h3>
        ${renderPane(current)}
      </article>
    </div>
  </section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenUPM README Markdown Renderer Comparison</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    body {
      margin: 0;
      padding: 2rem;
    }
    main {
      margin: 0 auto;
      max-width: 1200px;
    }
    .fixture {
      border-top: 1px solid #d0d7de;
      padding: 1.5rem 0;
    }
    .comparison {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    article {
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 1rem;
    }
    iframe.rendered {
      border: 0;
      min-height: 560px;
      width: 100%;
    }
    pre {
      overflow: auto;
      padding: 1rem;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    img {
      max-width: 100%;
    }
    .markdown-alert {
      border-left: .25rem solid #d0d7de;
      margin-bottom: 1rem;
      padding: .5rem 1rem;
    }
    .markdown-alert-title {
      align-items: center;
      display: flex;
      font-weight: 600;
      gap: .45rem;
      margin-bottom: .45rem;
    }
    .markdown-alert-title svg {
      fill: currentColor;
    }
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
    @media (max-width: 760px) {
      body { padding: 1rem; }
      .comparison { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <h1>OpenUPM README Markdown Renderer Comparison</h1>
    <p>This local demo renders the same fixture corpus through the legacy renderer and the local GFM renderer.</p>
    ${fixtures.map(renderFixture).join('\n')}
  </main>
</body>
</html>
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html);
console.log(`Wrote ${outputPath}`);
