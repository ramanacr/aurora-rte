import type { AuroraEditor } from '@aurora/editor';
import { defaultSlashCommands, type SlashCommandItem } from '@aurora/features';

export interface SlashMenuOptions {
  editor: AuroraEditor;
  container?: HTMLElement;
  commands?: SlashCommandItem[];
  onSelect?: (command: SlashCommandItem) => void;
}

export interface SlashMenuInstance {
  open(query?: string): void;
  close(): void;
  element: HTMLElement;
  destroy(): void;
}

export function createSlashMenu(options: SlashMenuOptions): SlashMenuInstance {
  const { editor } = options;
  const parent = options.container || document.body;
  const commands = options.commands || defaultSlashCommands();
  const editorEl = editor.getElement();
  let slashActive = false;
  let slashQuery = '';

  const menu = document.createElement('div');
  menu.className = 'aurora-slash-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Commands menu');
  menu.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9999;
    background: var(--aurora-muted-bg, #24292c);
    color: var(--aurora-fg, #f1f4ef);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    padding: 6px;
    max-height: 290px;
    overflow-y: auto;
    width: 280px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(12px);
    font-family: var(--aurora-font-family, system-ui, sans-serif);
    user-select: none;
  `;

  parent.appendChild(menu);

  let selectedIndex = 0;
  let currentFiltered = [...commands];

  const getCommandIcon = (id: string): string => {
    switch (id) {
      case 'paragraph': return '¶';
      case 'h1': return 'H1';
      case 'h2': return 'H2';
      case 'h3': return 'H3';
      case 'bullet-list': return '•';
      case 'ordered-list': return '1.';
      case 'quote': return '”';
      case 'code-block': return '&lt;/&gt;';
      case 'table': return '▦';
      case 'divider': return '―';
      default: return '✦';
    }
  };

  function renderList() {
    menu.innerHTML = '';
    if (currentFiltered.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 10px 12px; font-size: 13px; color: var(--aurora-muted-fg, #aab2b0); text-align: center;';
      empty.textContent = 'No matching commands';
      menu.appendChild(empty);
      return;
    }

    currentFiltered.forEach((cmd, idx) => {
      const isSel = idx === selectedIndex;
      const item = document.createElement('div');
      item.className = `aurora-slash-item ${isSel ? 'is-selected' : ''}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', isSel ? 'true' : 'false');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        cursor: pointer;
        border-radius: 6px;
        margin-bottom: 2px;
        border-left: 3px solid ${isSel ? 'var(--aurora-primary, #b7ff3c)' : 'transparent'};
        background: ${isSel ? 'rgba(183, 255, 60, 0.14)' : 'transparent'};
        transition: background 0.12s, border-color 0.12s;
      `;

      const iconBox = document.createElement('div');
      iconBox.style.cssText = `
        width: 26px;
        height: 26px;
        border-radius: 4px;
        background: ${isSel ? 'rgba(183, 255, 60, 0.22)' : 'rgba(255, 255, 255, 0.06)'};
        color: ${isSel ? 'var(--aurora-primary, #b7ff3c)' : 'var(--aurora-muted-fg, #aab2b0)'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
      `;
      iconBox.innerHTML = getCommandIcon(cmd.id);

      const contentBox = document.createElement('div');
      contentBox.style.flex = '1';
      contentBox.style.minWidth = '0';

      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.fontSize = '13px';
      title.style.color = isSel ? 'var(--aurora-primary, #b7ff3c)' : 'var(--aurora-fg, #f1f4ef)';
      title.textContent = cmd.title;

      const desc = document.createElement('div');
      desc.style.fontSize = '11px';
      desc.style.marginTop = '1px';
      desc.style.color = 'var(--aurora-muted-fg, #aab2b0)';
      desc.style.whiteSpace = 'nowrap';
      desc.style.overflow = 'hidden';
      desc.style.textOverflow = 'ellipsis';
      desc.textContent = cmd.description;

      contentBox.appendChild(title);
      contentBox.appendChild(desc);

      item.appendChild(iconBox);
      item.appendChild(contentBox);

      item.addEventListener('mouseenter', () => {
        selectedIndex = idx;
        renderList();
      });

      item.addEventListener('click', () => {
        cmd.action(editor);
        options.onSelect?.(cmd);
        close();
      });

      menu.appendChild(item);
    });

    // Ensure selected element is scrolled into view
    const selectedEl = menu.querySelector('.is-selected') as HTMLElement | null;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  function open(query = '') {
    if (!editor.isEditable()) return;
    const q = query.toLowerCase().trim();
    currentFiltered = q
      ? commands.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      : commands;
    selectedIndex = 0;
    renderList();

    // Position near selection
    const browserSel = window.getSelection?.();
    if (browserSel && browserSel.rangeCount > 0) {
      const range = browserSel.getRangeAt(0);
      let rect = range.getBoundingClientRect();
      if ((rect.width === 0 && rect.height === 0) || (rect.top === 0 && rect.bottom === 0)) {
        const containerEl = range.startContainer instanceof HTMLElement
          ? range.startContainer
          : range.startContainer.parentElement;
        if (containerEl) {
          rect = containerEl.getBoundingClientRect();
        }
      }
      if ((rect.top === 0 && rect.bottom === 0) && editorEl) {
        const edRect = editorEl.getBoundingClientRect();
        rect = new DOMRect(edRect.left + 24, edRect.top + 60, 0, 0);
      }
      let top = rect.bottom + 8;
      let left = rect.left;
      if (top + 300 > window.innerHeight) {
        top = Math.max(10, rect.top - 300);
      }
      if (left + 290 > window.innerWidth) {
        left = window.innerWidth - 300;
      }
      menu.style.top = `${Math.round(top)}px`;
      menu.style.left = `${Math.round(left)}px`;
    }

    menu.style.display = 'block';
  }

  function close() {
    slashActive = false;
    slashQuery = '';
    menu.style.display = 'none';
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (menu.style.display !== 'block') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentFiltered.length;
      renderList();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentFiltered.length) % currentFiltered.length;
      renderList();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFiltered[selectedIndex]) {
        currentFiltered[selectedIndex].action(editor);
        options.onSelect?.(currentFiltered[selectedIndex]);
        close();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const handleEditorKeyDown = (e: KeyboardEvent) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      slashActive = true;
      slashQuery = '';
      setTimeout(() => open(''), 10);
    } else if (slashActive && menu.style.display === 'block') {
      if (e.key === ' ' || e.key === 'Escape') {
        slashActive = false;
        close();
      } else if (e.key === 'Backspace') {
        if (slashQuery.length > 0) {
          slashQuery = slashQuery.slice(0, -1);
          open(slashQuery);
        } else {
          slashActive = false;
          close();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        slashQuery += e.key;
        open(slashQuery);
      }
    }
  };

  const handleDocumentClick = (e: MouseEvent) => {
    if (menu.style.display === 'block' && !menu.contains(e.target as Node)) {
      close();
    }
  };

  editorEl?.addEventListener('keydown', handleEditorKeyDown);
  window.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('click', handleDocumentClick, true);

  return {
    open,
    close,
    element: menu,
    destroy() {
      editorEl?.removeEventListener('keydown', handleEditorKeyDown);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('click', handleDocumentClick, true);
      menu.remove();
    }
  };
}
