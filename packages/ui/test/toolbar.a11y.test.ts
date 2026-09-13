// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createEditor } from '@aurora/editor';
import { createToolbar } from '../src/toolbar.js';

describe('Toolbar Accessibility and Keyboard Navigation', () => {
  it('renders toolbar with roving tabindex and accessible names', () => {
    const editor = createEditor();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const toolbar = createToolbar({ editor, container });
    const buttons = container.querySelectorAll('button');

    expect(buttons.length).toBeGreaterThan(0);

    const boldBtn = container.querySelector('button[aria-label="Bold"]') as HTMLButtonElement;
    expect(boldBtn).not.toBeNull();
    expect(boldBtn.getAttribute('aria-pressed')).toBe('false');

    // First button has tabindex="0", others have tabindex="-1"
    expect(buttons[0].tabIndex).toBe(0);
    for (let i = 1; i < buttons.length; i++) {
      expect(buttons[i].tabIndex).toBe(-1);
    }

    // Keyboard navigation: ArrowRight moves focus and tabindex to next button
    buttons[0].focus();
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(buttons[0].tabIndex).toBe(-1);
    expect(buttons[1].tabIndex).toBe(0);

    toolbar.destroy();
    editor.destroy();
    container.remove();
  });

  it('updates aria-pressed when selection marks change', () => {
    const editor = createEditor();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const toolbar = createToolbar({ editor, container });
    const boldBtn = container.querySelector('button[aria-label="Bold"]') as HTMLButtonElement;

    expect(boldBtn.getAttribute('aria-pressed')).toBe('false');

    // Simulate bold mark toggle
    editor.execute('toggleBold');
    expect(boldBtn.getAttribute('aria-pressed')).toBe('true');

    toolbar.destroy();
    editor.destroy();
    container.remove();
  });
});
