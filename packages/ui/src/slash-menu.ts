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

  const menu = document.createElement('div');
  menu.className = 'aurora-slash-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Commands menu');
  menu.style.cssText = 'position: absolute; display: none; z-index: 1000; background: var(--aurora-bg, #fff); border: 1px solid var(--aurora-border, #ccc); border-radius: 6px; padding: 6px; max-height: 280px; overflow-y: auto; width: 260px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);';

  parent.appendChild(menu);

  let selectedIndex = 0;
  let currentFiltered = [...commands];

  function renderList() {
    menu.innerHTML = '';
    currentFiltered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = `aurora-slash-item ${idx === selectedIndex ? 'is-selected' : ''}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', idx === selectedIndex ? 'true' : 'false');
      item.style.cssText = `padding: 8px 12px; cursor: pointer; border-radius: 4px; ${idx === selectedIndex ? 'background: var(--aurora-muted-bg, #f1f5f9);' : ''}`;

      const title = document.createElement('div');
      title.style.fontWeight = 'bold';
      title.textContent = cmd.title;

      const desc = document.createElement('div');
      desc.style.fontSize = '0.85rem';
      desc.style.color = 'var(--aurora-muted-fg, #64748b)';
      desc.textContent = cmd.description;

      item.appendChild(title);
      item.appendChild(desc);

      item.addEventListener('click', () => {
        cmd.action(editor);
        options.onSelect?.(cmd);
        close();
      });

      menu.appendChild(item);
    });
  }

  function open(query = '') {
    if (!editor.isEditable()) return;
    const q = query.toLowerCase().trim();
    currentFiltered = q
      ? commands.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      : commands;
    selectedIndex = 0;
    renderList();
    menu.style.display = 'block';
  }

  function close() {
    menu.style.display = 'none';
  }

  return {
    open,
    close,
    element: menu,
    destroy() {
      menu.remove();
    }
  };
}
