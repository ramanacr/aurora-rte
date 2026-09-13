import { describe, it, expect, vi } from 'vitest';
import { createEditor } from '../src/create-editor.js';
import type { EditorChange } from '../src/events.js';
import type { AuroraDocument } from '@aurora/model';

const emptyDocument: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial' }] }]
};

describe('createEditor facade', () => {
  it('emits a valid Aurora change without exposing engine state', () => {
    const editor = createEditor({ document: emptyDocument });
    const changes: EditorChange[] = [];
    editor.on('change', (change) => changes.push(change));

    editor.execute('insertText', { text: 'Safe text' });

    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].document.format).toBe('aurora');
    expect(changes[0].document.version).toBe(1);
    expect(changes[0].origin).toBe('command');
    expect(typeof changes[0].transactionId).toBe('string');
    // Ensure ProseMirror state is never leaked on the editor instance
    expect('proseMirrorState' in editor).toBe(false);
    expect('view' in editor).toBe(false);
    expect('state' in editor).toBe(false);

    editor.destroy();
  });

  it('provides getDocument, setDocument, and focus', () => {
    const editor = createEditor({ document: emptyDocument });
    const doc = editor.getDocument();
    expect(doc.format).toBe('aurora');
    expect(doc.content[0].type).toBe('paragraph');

    const newDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated content' }] }]
    };
    editor.setDocument(newDoc);
    expect(editor.getDocument().content[0].content?.[0].text).toBe('Updated content');

    editor.destroy();
  });

  it('supports event subscription and unsubscribe', () => {
    const editor = createEditor({ document: emptyDocument });
    const listener = vi.fn();
    const unsub = editor.on('change', listener);

    editor.execute('insertText', { text: 'Another' });
    expect(listener).toHaveBeenCalled();

    unsub();
    listener.mockClear();
    editor.execute('insertText', { text: 'More' });
    expect(listener).not.toHaveBeenCalled();

    editor.destroy();
  });
});
