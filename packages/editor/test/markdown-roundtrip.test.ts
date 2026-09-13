import { describe, it, expect } from 'vitest';
import { importMarkdown, exportMarkdown } from '../src/markdown.js';

describe('Markdown Import/Export', () => {
  it('round-trips headings, paragraphs, lists, quotes, and inline styles', () => {
    const originalMd = `# Heading 1

This is a paragraph with **bold** and *italic* and [a link](https://example.com).

> A block quote

- Item 1
- Item 2

1. Ordered 1
2. Ordered 2

\`\`\`ts
const x = 1;
\`\`\``;

    const doc = importMarkdown(originalMd);
    expect(doc.format).toBe('aurora');
    expect(doc.version).toBe(1);

    const exportedMd = exportMarkdown(doc);
    expect(exportedMd).toContain('# Heading 1');
    expect(exportedMd).toContain('**bold**');
    expect(exportedMd).toContain('*italic*');
    expect(exportedMd).toContain('[a link](https://example.com)');
    expect(exportedMd).toContain('> A block quote');
    expect(exportedMd).toContain('- Item 1');
    expect(exportedMd).toContain('1. Ordered 1');
    expect(exportedMd).toContain('```');
  });
});
