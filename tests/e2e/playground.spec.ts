// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { initPlayground } from '../../apps/playground/src/main.js';
import { insertSampleCallout } from '../../apps/playground/src/examples/custom-block.js';

describe('Playground Integration E2E', () => {
  it('mounts playground with toolbar, buttons, and custom blocks', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const editor = initPlayground(root);
    expect(editor).not.toBeNull();

    // Verify DOM structure
    const title = root.querySelector('h2');
    expect(title?.textContent).toContain('Aurora Editor Playground');

    const toolbar = root.querySelector('.aurora-toolbar');
    expect(toolbar).not.toBeNull();

    // Insert custom block
    const result = insertSampleCallout(editor);
    expect(result.success).toBe(true);

    const doc = editor.getDocument();
    const hasCustomBlock = doc.content.some((n) => n.type === 'custom_block');
    expect(hasCustomBlock).toBe(true);

    editor.destroy();
    root.remove();
  });
});
