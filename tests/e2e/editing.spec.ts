import { describe, it, expect } from 'vitest';
import { createEditor } from '@aurora/editor';
import { createToolbar } from '@aurora/ui';
import { basicFormatting, tables, links } from '@aurora/features';

describe('End-to-End Editing Workflows', () => {
  it('performs full rich-text composition with toolbar and commands', () => {
    const container = document.createElement('div');
    const editorEl = document.createElement('div');
    const toolbarEl = document.createElement('div');
    container.appendChild(toolbarEl);
    container.appendChild(editorEl);
    document.body.appendChild(container);

    const editor = createEditor({
      element: editorEl,
      document: {
        format: 'aurora',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Welcome to Aurora Editor' }]
          }
        ]
      }
    });

    const toolbar = createToolbar({ editor, container: toolbarEl });
    const basic = basicFormatting().init(editor);
    const tbl = tables().init(editor);
    const lnk = links().init(editor);

    // 1. Check initial document
    expect(editor.getDocument().content[0].content?.[0].text).toBe('Welcome to Aurora Editor');

    // 2. Set Heading
    basic.setHeading(1);
    expect(editor.getDocument().content[0].type).toBe('heading');
    expect(editor.getDocument().content[0].attrs?.level).toBe(1);

    // 3. Insert table
    tbl.insertTable(2, 2);
    expect(editor.getDocument().content.some((n) => n.type === 'table')).toBe(true);

    // 4. Set valid link
    const linkRes = lnk.setLink('https://aurora.dev', 'Aurora Dev');
    expect(linkRes.success).toBe(true);

    // 5. Export to HTML and Markdown
    const html = editor.export({ format: 'html' });
    expect(html).toContain('<h1');
    expect(html).toContain('<table');

    const md = editor.export({ format: 'markdown' });
    expect(md).toContain('# ');

    // 6. Destroy
    toolbar.destroy();
    editor.destroy();
    container.remove();
  });
});
