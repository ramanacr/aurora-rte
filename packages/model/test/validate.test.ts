import { describe, it, expect } from 'vitest';
import { validateDocument, ValidationError } from '../src/validate.js';
import type { AuroraDocument } from '../src/document.js';

describe('validateDocument', () => {
  it('rejects an invalid document and accepts the current format', () => {
    expect(() => validateDocument({ format: 'aurora', version: 0, content: [] })).toThrow();
    expect(validateDocument({ format: 'aurora', version: 1, content: [] }).version).toBe(1);
  });

  it('rejects documents with wrong format or missing fields', () => {
    expect(() => validateDocument(null)).toThrow(ValidationError);
    expect(() => validateDocument({})).toThrow(ValidationError);
    expect(() => validateDocument({ format: 'docx', version: 1, content: [] })).toThrow(ValidationError);
    expect(() => validateDocument({ format: 'aurora', version: -1, content: [] })).toThrow(ValidationError);
    expect(() => validateDocument({ format: 'aurora', version: 1.5, content: [] })).toThrow(ValidationError);
    expect(() => validateDocument({ format: 'aurora', version: 1, content: 'not an array' })).toThrow(ValidationError);
  });

  it('validates standard rich text content', () => {
    const doc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'world', marks: [{ type: 'italic' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Subheading' }]
        },
        {
          type: 'table',
          attrs: { rows: 1, cols: 1 },
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell' }] }]
                }
              ]
            }
          ]
        }
      ],
      meta: { title: 'Test Document' }
    };

    const validated = validateDocument(doc);
    expect(validated.format).toBe('aurora');
    expect(validated.content.length).toBe(3);
  });

  it('enforces limits on depth, node count, and text length', () => {
    // Exceed node count limit
    const hugeContent: any[] = [];
    for (let i = 0; i < 50; i++) {
      hugeContent.push({ type: 'paragraph', content: [{ type: 'text', text: 'a' }] });
    }
    expect(() => validateDocument({ format: 'aurora', version: 1, content: hugeContent }, { maxNodes: 20 })).toThrow(/limit/i);

    // Exceed depth limit
    let nested: any = { type: 'paragraph', content: [{ type: 'text', text: 'deep' }] };
    for (let i = 0; i < 15; i++) {
      nested = { type: 'blockquote', content: [nested] };
    }
    expect(() => validateDocument({ format: 'aurora', version: 1, content: [nested] }, { maxDepth: 5 })).toThrow(/depth/i);

    // Exceed table limits
    const bigTable = {
      type: 'table',
      attrs: { rows: 200, cols: 2 },
      content: []
    };
    expect(() => validateDocument({ format: 'aurora', version: 1, content: [bigTable] }, { maxTableRows: 100 })).toThrow(/table/i);
  });
});
