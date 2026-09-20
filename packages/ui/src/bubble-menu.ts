import type { AuroraEditor, SelectionState } from '@aurora/editor';
import { promptLinkDialog } from './dialog.js';

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
  menu.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9998;
    background: var(--aurora-muted-bg, #24292c);
    color: var(--aurora-fg, #f1f4ef);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    padding: 4px 6px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    align-items: center;
    gap: 3px;
    font-family: var(--aurora-font-family, system-ui, sans-serif);
    transition: opacity 0.15s ease, transform 0.15s ease;
    user-select: none;
  `;

  interface ActionBtn {
    id: string;
    label: string;
    title: string;
    action: () => void;
    mark?: string;
    style?: string;
  }

  const actions: ActionBtn[] = [
    {
      id: 'bold',
      label: 'B',
      title: 'Bold (Ctrl+B)',
      mark: 'bold',
      style: 'font-weight: 700;',
      action: () => editor.execute('toggleBold')
    },
    {
      id: 'italic',
      label: 'I',
      title: 'Italic (Ctrl+I)',
      mark: 'italic',
      style: 'font-style: italic;',
      action: () => editor.execute('toggleItalic')
    },
    {
      id: 'underline',
      label: 'U',
      title: 'Underline (Ctrl+U)',
      mark: 'underline',
      style: 'text-decoration: underline;',
      action: () => editor.execute('toggleUnderline')
    },
    {
      id: 'strike',
      label: 'S',
      title: 'Strikethrough',
      mark: 'strike',
      style: 'text-decoration: line-through;',
      action: () => editor.execute('toggleStrike')
    },
    {
      id: 'code',
      label: '</>',
      title: 'Inline Code (Ctrl+E)',
      mark: 'code',
      style: 'font-family: monospace; font-size: 11px;',
      action: () => editor.execute('toggleCode')
    },
    {
      id: 'highlight',
      label: '🖌️',
      title: 'Highlight Text',
      mark: 'highlight',
      action: () => editor.execute('toggleHighlight')
    },
    {
      id: 'link',
      label: '🔗',
      title: 'Link (Ctrl+K)',
      mark: 'link',
      action: () => {
        const sel = window.getSelection?.();
        const selectedText = sel ? sel.toString() : '';
        promptLinkDialog(editor, { text: selectedText });
      }
    }
  ];

  const buttonElements = new Map<string, HTMLButtonElement>();

  actions.forEach((act) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-action', act.id);
    btn.setAttribute('aria-label', act.title);
    btn.title = act.title;
    btn.innerHTML = act.label;
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 2px 6px;
      border-radius: 5px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--aurora-fg, #f8fafc);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.12s;
      ${act.style || ''}
    `;

    btn.addEventListener('mouseenter', () => {
      if (!btn.getAttribute('data-active')) {
        btn.style.background = 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = 'var(--aurora-border, #1e293b)';
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (!btn.getAttribute('data-active')) {
        btn.style.background = 'transparent';
        btn.style.borderColor = 'transparent';
      }
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      act.action();
      editor.focus();
    });

    buttonElements.set(act.id, btn);
    menu.appendChild(btn);
  });

  parent.appendChild(menu);

  function updateActiveMarks(activeMarks: string[]) {
    actions.forEach((act) => {
      const btn = buttonElements.get(act.id);
      if (!btn) return;
      const isActive = act.mark ? activeMarks.includes(act.mark) : false;
      if (isActive) {
        btn.setAttribute('data-active', 'true');
        btn.style.background = 'rgba(183, 255, 60, 0.22)';
        btn.style.borderColor = 'rgba(183, 255, 60, 0.45)';
        btn.style.color = 'var(--aurora-primary, #b7ff3c)';
        btn.style.boxShadow = '0 0 8px rgba(183, 255, 60, 0.25)';
      } else {
        btn.removeAttribute('data-active');
        btn.style.background = 'transparent';
        btn.style.borderColor = 'transparent';
        btn.style.color = 'var(--aurora-fg, #f1f4ef)';
        btn.style.boxShadow = 'none';
      }
    });
  }

  function hideMenu() {
    menu.style.display = 'none';
  }

  function positionMenu(rect: DOMRect) {
    menu.style.display = 'flex';
    const menuRect = menu.getBoundingClientRect();

    let top = rect.top - menuRect.height - 8;
    if (top < 10) {
      top = rect.bottom + 8;
    }

    let left = rect.left + rect.width / 2 - menuRect.width / 2;
    if (left + menuRect.width > window.innerWidth - 10) {
      left = window.innerWidth - menuRect.width - 10;
    }
    if (left < 10) left = 10;

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
  }

  const unsub = editor.on('selectionChange', (sel: SelectionState) => {
    if (!editor.isEditable()) {
      hideMenu();
      return;
    }
    if (!sel.empty && sel.selectedText && sel.selectedText.trim().length > 0) {
      updateActiveMarks(sel.activeMarks);
      const browserSel = window.getSelection?.();
      if (browserSel && browserSel.rangeCount > 0) {
        const rect = browserSel.getRangeAt(0).getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          positionMenu(rect);
          return;
        }
      }
    }
    hideMenu();
  });

  const handleScroll = () => {
    if (menu.style.display === 'flex') {
      const browserSel = window.getSelection?.();
      if (browserSel && browserSel.rangeCount > 0) {
        const rect = browserSel.getRangeAt(0).getBoundingClientRect();
        if (rect.width > 0) {
          positionMenu(rect);
          return;
        }
      }
      hideMenu();
    }
  };

  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleScroll);

  return {
    element: menu,
    destroy() {
      unsub();
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      menu.remove();
    }
  };
}
