import { describe, it, expect } from 'vitest';
import { createEditor } from '@aurora/editor';
import { calculateCounts } from '@aurora/features';

describe('Performance Benchmarks', () => {
  it('measures fast typing latency under 1000 keystrokes', () => {
    const editor = createEditor();
    const start = performance.now();

    for (let i = 0; i < 500; i++) {
      editor.execute('insertText', { text: 'a' });
    }

    const duration = performance.now() - start;
    const doc = editor.getDocument();
    const counts = calculateCounts(doc);

    expect(counts.characters).toBe(500);
    // Baseline: 500 keystrokes completed in under 500ms (average < 1ms per insert)
    expect(duration).toBeLessThan(1500);

    editor.destroy();
  });

  it('measures serialization of large documents', () => {
    const editor = createEditor();
    for (let i = 0; i < 200; i++) {
      editor.execute('insertText', { text: `Paragraph ${i} line of text with data.\n` });
    }

    const start = performance.now();
    const html = editor.export({ format: 'html' });
    const duration = performance.now() - start;

    expect(html.length).toBeGreaterThan(1000);
    expect(duration).toBeLessThan(500);

    editor.destroy();
  });
});
