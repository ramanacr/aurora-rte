// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AuroraEditor, type AuroraEditorRef } from '../src/index.js';
import type { AuroraDocument } from '@aurora/model';

const emptyDocument: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello React' }] }]
};

describe('React AuroraEditor Bridge', () => {
  it('mounts and exposes ref methods with Aurora document format', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const ref = createRef<AuroraEditorRef>();
    const onChange = vi.fn();

    const root = createRoot(container);
    root.render(<AuroraEditor ref={ref} document={emptyDocument} onChange={onChange} />);

    // Wait for effect mount
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ref.current).not.toBeNull();
    const doc = ref.current?.getDocument();
    expect(doc?.format).toBe('aurora');
    expect(doc?.version).toBe(1);
    expect(doc?.content[0].content?.[0].text).toBe('Hello React');

    // Execute text insertion through imperative ref
    ref.current?.execute('insertText', { text: ' - added' });

    expect(onChange).toHaveBeenCalled();
    const emittedDoc = onChange.mock.calls[0][0].document;
    expect(emittedDoc.format).toBe('aurora');

    root.unmount();
    container.remove();
  });
});
