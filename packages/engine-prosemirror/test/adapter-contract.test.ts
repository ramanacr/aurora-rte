import { describe, it, expect } from 'vitest';
import { createEngineAdapter } from '../src/adapter.js';
import type { AuroraDocument } from '@aurora/model';

const sampleDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ', marks: [{ type: 'bold' }] },
        { type: 'text', text: 'world' }
      ]
    }
  ]
};

describe('Engine Adapter Contract', () => {
  it('converts AuroraDocument to engine state and round-trips back to AuroraDocument', () => {
    const adapter = createEngineAdapter({ document: sampleDoc });
    const outputDoc = adapter.getDocument();

    expect(outputDoc.format).toBe('aurora');
    expect(outputDoc.version).toBe(1);
    expect(outputDoc.content[0].type).toBe('paragraph');
    expect(outputDoc.content[0].content?.[0].text).toBe('Hello ');
    expect(outputDoc.content[0].content?.[0].marks?.[0].type).toBe('bold');
    expect(outputDoc.content[0].content?.[1].text).toBe('world');

    adapter.destroy();
  });

  it('executes text insertion and commands and generates JSON patches', () => {
    let capturedChange: any = null;
    const adapter = createEngineAdapter({
      document: sampleDoc,
      onChange: (change) => {
        capturedChange = change;
      }
    });

    const result = adapter.execute('insertText', { text: '!!' });
    expect(result.success).toBe(true);
    expect(capturedChange).not.toBeNull();
    expect(capturedChange.document.format).toBe('aurora');
    expect(Array.isArray(capturedChange.patches)).toBe(true);

    adapter.destroy();
  });

  it('clears marks when clearFormatting is executed', () => {
    const adapter = createEngineAdapter({ document: sampleDoc });
    const res = adapter.execute('clearFormatting');
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    const marks = out.content[0].content?.[0].marks;
    expect(marks == null || marks.length === 0).toBe(true);
    adapter.destroy();
  });

  it('resets heading to paragraph when clearFormatting is executed', () => {
    const headingDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Section Title', marks: [{ type: 'italic' }] }]
        }
      ]
    };
    const adapter = createEngineAdapter({ document: headingDoc });
    const res = adapter.execute('clearFormatting');
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    expect(out.content[0].type).toBe('paragraph');
    const marks = out.content[0].content?.[0].marks;
    expect(marks == null || marks.length === 0).toBe(true);
    adapter.destroy();
  });

  it('resets table cell shading and marks when clearFormatting is executed in a table', () => {
    const tableDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'table',
          attrs: { striped: true, bordered: false, tableWidth: '500px' },
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  attrs: { background: 'rgba(0, 229, 255, 0.15)', align: 'center' },
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Cell Content', marks: [{ type: 'bold' }] }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
    const adapter = createEngineAdapter({ document: tableDoc });
    const res = adapter.execute('clearFormatting');
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    const cell = (out.content[0].content?.[0] as any)?.content?.[0];
    expect(cell.attrs?.background).toBeNull();
    const cellTextMarks = cell.content?.[0]?.content?.[0]?.marks;
    expect(cellTextMarks == null || cellTextMarks.length === 0).toBe(true);
    adapter.destroy();
  });

  it('resets image attributes when clearFormatting is executed on an image', () => {
    const imageDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'image',
          attrs: {
            src: 'https://example.com/test.jpg',
            width: '300px',
            rounded: true,
            shadow: true,
            border: true,
            align: 'right'
          }
        }
      ]
    };
    const adapter = createEngineAdapter({ document: imageDoc });
    const res = adapter.execute('clearFormatting');
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    const imgAttrs = out.content[0].attrs;
    expect(imgAttrs?.rounded).toBe(false);
    expect(imgAttrs?.shadow).toBe(false);
    expect(imgAttrs?.border).toBe(false);
    expect(imgAttrs?.width == null || imgAttrs.width === '').toBe(true);
    adapter.destroy();
  });

  it('removes links when clearFormatting is executed', () => {
    const linkDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Click here',
              marks: [{ type: 'link', attrs: { href: 'https://aurora-rte.dev' } }]
            }
          ]
        }
      ]
    };
    const adapter = createEngineAdapter({ document: linkDoc });
    const res = adapter.execute('clearFormatting');
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    const marks = out.content[0].content?.[0].marks;
    expect(marks == null || marks.length === 0).toBe(true);
    adapter.destroy();
  });

  it('updates table styling attributes (striped, bordered, tableWidth) via updateTable', () => {
    const tableDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'table',
          attrs: { striped: false, bordered: true, tableWidth: '100%' },
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell 1' }] }]
                }
              ]
            }
          ]
        }
      ]
    };
    const adapter = createEngineAdapter({ document: tableDoc });
    const res = adapter.execute('updateTable', { striped: true, bordered: false, tableWidth: 'auto' });
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    const tableAttrs = out.content[0].attrs;
    expect(tableAttrs?.striped).toBe(true);
    expect(tableAttrs?.bordered).toBe(false);
    expect(tableAttrs?.tableWidth).toBe('auto');
    adapter.destroy();
  });

  it('updates table cell shading and attributes via updateTableCell', () => {
    const tableDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  attrs: { background: null, align: null },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shaded' }] }]
                }
              ]
            }
          ]
        }
      ]
    };
    const adapter = createEngineAdapter({ document: tableDoc });
    const res = adapter.execute('updateTableCell', { background: 'rgba(0, 229, 255, 0.15)', align: 'center' });
    expect(res.success).toBe(true);

    const out = adapter.getDocument();
    const cell = (out.content[0].content?.[0] as any)?.content?.[0];
    expect(cell.attrs?.background).toBe('rgba(0, 229, 255, 0.15)');
    expect(cell.attrs?.align).toBe('center');
    adapter.destroy();
  });

  it('updates table row height and col width via setTableRowHeight and setTableColWidth', () => {
    const tableDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'table_row',
              attrs: { height: null },
              content: [
                {
                  type: 'table_cell',
                  attrs: { colwidth: null },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dimensioned' }] }]
                }
              ]
            }
          ]
        }
      ]
    };
    const adapter = createEngineAdapter({ document: tableDoc });
    const hRes = adapter.execute('setTableRowHeight', { rowIndex: 0, height: '60px' });
    expect(hRes.success).toBe(true);

    const wRes = adapter.execute('setTableColWidth', { colIndex: 0, width: '180px' });
    expect(wRes.success).toBe(true);

    const out = adapter.getDocument();
    const row = out.content[0].content?.[0];
    expect(row?.attrs?.height).toBe('60px');
    const cell = (row as any)?.content?.[0];
    expect(cell?.attrs?.colwidth).toBe('180px');
    adapter.destroy();
  });
});
