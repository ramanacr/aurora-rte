// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import '../src/index.js';
import type { AuroraEditorElement } from '../src/aurora-editor.js';

describe('<aurora-editor> Web Component', () => {
  it('registers custom element and dispatches aurora-change events with aurora format', () => {
    const el = document.createElement('aurora-editor') as AuroraEditorElement;
    document.body.appendChild(el);

    const changeListener = vi.fn();
    el.addEventListener('aurora-change', changeListener);

    el.execute('insertText', { text: 'Custom Element Text' });

    expect(changeListener).toHaveBeenCalled();
    const eventDetail = changeListener.mock.calls[0][0].detail;
    expect(eventDetail.document.format).toBe('aurora');
    expect(eventDetail.document.version).toBe(1);

    const doc = el.getDocument();
    expect(doc?.format).toBe('aurora');

    el.remove();
  });
});
