import { Component, OnInit, OnDestroy } from '@angular/core';
import { HtmlAuthoringService } from './authoring.service.js';

interface PaletteAction {
  id: string;
  title: string;
  category: string;
  description: string;
  shortcut?: string;
  icon?: string;
  execute: () => void;
}

@Component({
  selector: 'aurora-command-palette',
  standalone: true,
  template: `
    @if (authoringService.isCommandPaletteOpen) {
      <div class="aurora-palette-overlay" (click)="close()">
        <div class="aurora-palette-box" (click)="$event.stopPropagation()">
          <div class="aurora-palette-search">
            <span class="aurora-palette-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Type a command, element tag, or action... (Esc to cancel)"
              [value]="searchQuery"
              (input)="onSearchInput($event)"
              autofocus
            />
          </div>

          <div class="aurora-palette-results">
            @if (filteredItems.length === 0) {
              <div class="aurora-palette-empty">
                No matching commands or elements found.
              </div>
            }
            @for (item of filteredItems; track item.id; let i = $index) {
              <button
                type="button"
                class="aurora-palette-item"
                [class.active]="i === selectedIndex"
                (click)="selectItem(item)"
                (mouseenter)="selectedIndex = i"
              >
                <span class="aurora-palette-item-icon">{{ item.icon || '⚡' }}</span>
                <div class="aurora-palette-item-meta">
                  <span class="aurora-palette-item-title">{{ item.title }}</span>
                  <span class="aurora-palette-item-desc">{{ item.description }}</span>
                </div>
                <span class="aurora-palette-item-category">{{ item.category }}</span>
                @if (item.shortcut) {
                  <span class="aurora-palette-item-shortcut">{{ item.shortcut }}</span>
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .aurora-palette-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 220000;
      display: flex;
      justify-content: center;
      padding-top: 12vh;
    }
    .aurora-palette-box {
      width: 580px;
      max-width: 90vw;
      background: white;
      border-radius: 10px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 60vh;
    }
    .aurora-palette-search {
      display: flex;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid #e2e8f0;
      gap: 10px;
    }
    .aurora-palette-search input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      color: #0f172a;
    }
    .aurora-palette-results {
      overflow-y: auto;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .aurora-palette-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
    }
    .aurora-palette-item.active, .aurora-palette-item:hover {
      background: #f1f5f9;
    }
    .aurora-palette-item-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .aurora-palette-item-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .aurora-palette-item-desc {
      font-size: 11px;
      color: #64748b;
    }
    .aurora-palette-item-category {
      font-size: 10px;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      color: #475569;
    }
    .aurora-palette-item-shortcut {
      font-family: monospace;
      font-size: 11px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
      color: #64748b;
    }
    .aurora-palette-empty {
      padding: 30px;
      text-align: center;
      color: #64748b;
    }
  `]
})
export class AuroraCommandPaletteComponent implements OnInit, OnDestroy {
  public searchQuery = '';
  public selectedIndex = 0;

  constructor(public authoringService: HtmlAuthoringService) {}

  ngOnInit() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  get baseActions(): PaletteAction[] {
    const editor = this.authoringService.getEditor();
    return [
      {
        id: 'cmd-undo',
        title: 'Undo',
        category: 'Edit',
        description: 'Revert previous change',
        shortcut: 'Ctrl+Z',
        execute: () => editor?.execute('undo')
      },
      {
        id: 'cmd-redo',
        title: 'Redo',
        category: 'Edit',
        description: 'Reapply undone change',
        shortcut: 'Ctrl+Y',
        execute: () => editor?.execute('redo')
      },
      {
        id: 'cmd-bold',
        title: 'Bold',
        category: 'Format',
        description: 'Toggle bold emphasis',
        shortcut: 'Ctrl+B',
        execute: () => editor?.execute('toggleBold')
      },
      {
        id: 'cmd-italic',
        title: 'Italic',
        category: 'Format',
        description: 'Toggle italic emphasis',
        shortcut: 'Ctrl+I',
        execute: () => editor?.execute('toggleItalic')
      },
      {
        id: 'cmd-table',
        title: 'Insert Table',
        category: 'Tables',
        description: 'Insert 3x3 table with headers',
        execute: () => editor?.execute('insertTable', { rows: 3, columns: 3 })
      },
      {
        id: 'cmd-picker',
        title: 'Open HTML Element Picker',
        category: 'Insert',
        description: 'Explore full library of HTML5 elements',
        execute: () => { this.authoringService.isElementPickerOpen = true; }
      }
    ];
  }

  get filteredItems(): PaletteAction[] {
    const q = this.searchQuery.trim().toLowerCase();
    const registry = this.authoringService.getRegistry();

    // Elements converted to actions
    const elementActions: PaletteAction[] = registry.getAll().map((def) => ({
      id: `elem-${def.tagName}`,
      title: `<${def.tagName}> (${def.displayName})`,
      category: `HTML: ${def.category}`,
      description: def.description,
      icon: '🏷️',
      execute: () => this.authoringService.insert(def)
    }));

    const all = [...this.baseActions, ...elementActions];
    if (!q) return all.slice(0, 12);

    return all.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 15);
  }

  onSearchInput(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.selectedIndex = 0;
  }

  close() {
    this.authoringService.isCommandPaletteOpen = false;
  }

  selectItem(item: PaletteAction) {
    item.execute();
    this.close();
  }

  handleKeyDown = (e: KeyboardEvent) => {
    // Open on Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.authoringService.isCommandPaletteOpen = !this.authoringService.isCommandPaletteOpen;
      return;
    }

    if (!this.authoringService.isCommandPaletteOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, this.filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % Math.max(1, this.filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.filteredItems[this.selectedIndex]) {
        this.selectItem(this.filteredItems[this.selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.close();
    }
  };
}
