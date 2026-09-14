import type { AuroraEditor, SelectionState } from '@aurora/editor';

export interface BubbleMenuOptions {
  editor: AuroraEditor;
  container?: HTMLElement;
}

export interface BubbleMenuInstance {
  element: HTMLElement;
  destroy(): void;
}

export function createBubbleMenu(options: BubbleMenuOptions): BubbleMenuInstance {
  const { editor } = options;
  const parent = options.container || document.body;

  const menu = document.createElement('div');
  menu.className = 'aurora-bubble-menu';
  menu.setAttribute('role', 'toolbar');
  menu.setAttribute('aria-label', 'Floating selection formatting toolbar');
  menu.style.cssText = 'position: absolute; display: none; z-index: 1000; background: var(--aurora-bg, #1e293b); border: 1px solid var(--aurora-border, #475569); border-radius: 4px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';

  const boldBtn = document.createElement('button');
  boldBtn.type = 'button';
  boldBtn.textContent = 'B';
  boldBtn.setAttribute('aria-label', 'Bold');
  boldBtn.style.cssText = 'font-weight: bold; padding: 4px 8px; margin: 0 2px; cursor: pointer;';
  boldBtn.addEventListener('click', () => editor.execute('toggleBold'));

  const italicBtn = document.createElement('button');
  italicBtn.type = 'button';
  italicBtn.textContent = 'I';
  italicBtn.setAttribute('aria-label', 'Italic');
  italicBtn.style.cssText = 'font-style: italic; padding: 4px 8px; margin: 0 2px; cursor: pointer;';
  italicBtn.addEventListener('click', () => editor.execute('toggleItalic'));

  menu.appendChild(boldBtn);
  menu.appendChild(italicBtn);
  parent.appendChild(menu);

  const unsub = editor.on('selectionChange', (sel: SelectionState) => {
    if (!editor.isEditable()) {
      menu.style.display = 'none';
      return;
    }
    if (!sel.empty && sel.selectedText) {
      menu.style.display = 'flex';
      // If native browser selection available, position near selection
      const browserSel = window.getSelection?.();
      if (browserSel && browserSel.rangeCount > 0) {
        const rect = browserSel.getRangeAt(0).getBoundingClientRect();
        menu.style.top = `${window.scrollY + rect.top - 40}px`;
        menu.style.left = `${window.scrollX + rect.left}px`;
      }
    } else {
      menu.style.display = 'none';
    }
  });

  return {
    element: menu,
    destroy() {
      unsub();
      menu.remove();
    }
  };
}
