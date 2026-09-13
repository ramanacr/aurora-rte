import { describe, it, expect } from 'vitest';
import { createEditor } from '@aurora/editor';
import {
  basicFormatting,
  tables,
  links,
  embeds,
  calculateCounts,
  cleanPastedHtml,
  findAndReplace
} from '../src/index.js';
import type { AuroraDocument } from '@aurora/model';

const doc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'The quick brown fox jumps over the lazy dog.' }]
    }
  ]
};

describe('@aurora/features', () => {
  it('initializes basic formatting and executes commands', () => {
    const editor = createEditor({ document: doc });
    const basic = basicFormatting().init(editor);

    expect(basic.toggleBold().success).toBe(true);
    expect(basic.setHeading(2).success).toBe(true);
    expect(editor.getDocument().content[0].type).toBe('heading');
    expect(editor.getDocument().content[0].attrs?.level).toBe(2);

    editor.destroy();
  });

  it('inserts tables with size constraints', () => {
    const editor = createEditor({ document: doc });
    const tbl = tables({ maxRows: 10, maxCols: 10 }).init(editor);

    const result = tbl.insertTable(3, 4);
    expect(result.success).toBe(true);
    const updated = editor.getDocument();
    const tableNode = updated.content.find((n) => n.type === 'table');
    expect(tableNode).toBeDefined();
    expect(tableNode?.attrs?.rows).toBe(3);
    expect(tableNode?.attrs?.cols).toBe(4);

    editor.destroy();
  });

  it('validates links and rejects unsafe protocols', () => {
    const editor = createEditor({ document: doc });
    const lnk = links().init(editor);

    const badResult = lnk.setLink('javascript:alert(1)');
    expect(badResult.success).toBe(false);

    const goodResult = lnk.setLink('https://aurora-rte.org', 'Aurora');
    expect(goodResult.success).toBe(true);

    editor.destroy();
  });

  it('validates embeds against allowlist and normalizes youtube URLs', async () => {
    const editor = createEditor({ document: doc });
    const emb = embeds().init(editor);

    const invalid = await emb.insertEmbed('https://evil-site.com/video');
    expect(invalid.success).toBe(false);

    const youtube = await emb.insertEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Video');
    expect(youtube.success).toBe(true);
    const embedNode = editor.getDocument().content.find((n) => n.type === 'embed');
    expect(embedNode).toBeDefined();
    expect(embedNode?.attrs?.url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');

    editor.destroy();
  });

  it('calculates accurate word and character counts', () => {
    const counts = calculateCounts(doc);
    expect(counts.words).toBe(9);
    expect(counts.characters).toBe(44);
    expect(counts.paragraphs).toBe(1);
  });

  it('cleans Word paste markup', () => {
    const wordHtml = `
      <!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]-->
      <p class="MsoNormal" style="mso-margin-top-alt:auto;font-family:Calibri;">Hello from <span style="mso-spacerun:yes"> </span>Word</p>
      <p class="MsoListParagraph"><span>·</span> Bullet item</p>
    `;
    const cleaned = cleanPastedHtml(wordHtml);
    expect(cleaned).not.toContain('w:WordDocument');
    expect(cleaned).not.toContain('mso-margin-top-alt');
    expect(cleaned).toContain('Hello from');
    expect(cleaned).toContain('<li>Bullet item</li>');
  });

  it('performs find and replace across document nodes', () => {
    const editor = createEditor({ document: doc });
    const fr = findAndReplace().init(editor);

    const match = fr.find('fox');
    expect(match.count).toBe(1);

    const replaced = fr.replaceAll('fox', 'cat');
    expect(replaced.replacedCount).toBe(1);
    expect(editor.getDocument().content[0].content?.[0].text).toContain('cat');

    editor.destroy();
  });
});
