import type { AuroraEditor, SelectionState } from '@aurora/editor';
import { t } from './i18n.js';

export interface ToolbarItem {
  id: string;
  labelKey: string;
  command: string;
  commandArgs?: Record<string, unknown>;
  markName?: string;
  icon?: string;
  text?: string;
}

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: 'bold', labelKey: 'toolbar.bold', command: 'toggleBold', markName: 'bold', text: 'B' },
  { id: 'italic', labelKey: 'toolbar.italic', command: 'toggleItalic', markName: 'italic', text: 'I' },
  { id: 'underline', labelKey: 'toolbar.underline', command: 'toggleUnderline', markName: 'underline', text: 'U' },
  { id: 'strike', labelKey: 'toolbar.strike', command: 'toggleStrike', markName: 'strike', text: 'S' },
  { id: 'code', labelKey: 'toolbar.code', command: 'toggleCode', markName: 'code', text: '<>' },
  { id: 'h1', labelKey: 'toolbar.h1', command: 'setHeading', commandArgs: { level: 1 }, text: 'H1' },
  { id: 'h2', labelKey: 'toolbar.h2', command: 'setHeading', commandArgs: { level: 2 }, text: 'H2' },
  { id: 'bulletList', labelKey: 'toolbar.bulletList', command: 'toggleBulletList', text: '• List' },
  { id: 'orderedList', labelKey: 'toolbar.orderedList', command: 'toggleOrderedList', text: '1. List' },
  { id: 'blockquote', labelKey: 'toolbar.blockquote', command: 'toggleBlockquote', text: '“' },
  { id: 'table', labelKey: 'toolbar.table', command: 'insertTable', commandArgs: { rows: 3, cols: 3, header: true }, text: 'Table' },
  { id: 'undo', labelKey: 'toolbar.undo', command: 'undo', text: '↩' },
  { id: 'redo', labelKey: 'toolbar.redo', command: 'redo', text: '↪' }
];

export interface ToolbarOptions {
  editor: AuroraEditor;
  container: HTMLElement;
  items?: ToolbarItem[];
}

export interface ToolbarInstance {
  element: HTMLElement;
  destroy(): void;
}

export function createToolbar(options: ToolbarOptions): ToolbarInstance {
  const { editor, container } = options;
  const items = options.items ?? DEFAULT_TOOLBAR_ITEMS;

  const toolbarEl = document.createElement('div');
  toolbarEl.setAttribute('role', 'toolbar');
  toolbarEl.setAttribute('aria-label', 'Editor formatting toolbar');
  toolbarEl.className = 'aurora-toolbar';

  const buttons: HTMLButtonElement[] = [];

  items.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', t(item.labelKey, item.id));
    btn.className = `aurora-toolbar-btn aurora-btn-${item.id}`;
    btn.textContent = item.text || item.id;
    btn.tabIndex = index === 0 ? 0 : -1;

    if (item.markName) {
      btn.setAttribute('aria-pressed', 'false');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      editor.execute(item.command, item.commandArgs);
      editor.focus();
    });

    btn.addEventListener('keydown', (e) => {
      handleKeydown(e, index);
    });

    buttons.push(btn);
    toolbarEl.appendChild(btn);
  });

  function setFocus(index: number) {
    buttons.forEach((b, i) => {
      b.tabIndex = i === index ? 0 : -1;
    });
    buttons[index]?.focus();
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocus((index + 1) % buttons.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocus((index - 1 + buttons.length) % buttons.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocus(0);
        break;
      case 'End':
        e.preventDefault();
        setFocus(buttons.length - 1);
        break;
    }
  }

  function updateActiveMarks(activeMarks: string[]) {
    items.forEach((item, idx) => {
      if (item.markName) {
        const isActive = activeMarks.includes(item.markName);
        buttons[idx].setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
          buttons[idx].classList.add('is-active');
        } else {
          buttons[idx].classList.remove('is-active');
        }
      }
    });
  }

  const unsubSelection = editor.on('selectionChange', (selection: SelectionState) => {
    updateActiveMarks(selection.activeMarks || []);
  });

  const unsubChange = editor.on('change', () => {
    // If command toggled mark while selection unchanged
    const doc = editor.getDocument();
    const activeMarks: string[] = [];
    doc.content.forEach((n) => {
      if (n.content) {
        n.content.forEach((c) => {
          if (c.marks) activeMarks.push(...c.marks.map((m) => m.type));
        });
      }
    });
    updateActiveMarks(Array.from(new Set(activeMarks)));
  });

  container.appendChild(toolbarEl);

  return {
    element: toolbarEl,
    destroy() {
      unsubSelection();
      unsubChange();
      toolbarEl.remove();
    }
  };
}
