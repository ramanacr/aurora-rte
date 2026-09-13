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
});
