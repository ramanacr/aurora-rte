import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import type { HtmlElementDefinition } from '@aurora/ui';
import { HtmlAuthoringService } from './authoring.service.js';

@Component({
  selector: 'aurora-slash-command-menu',
  standalone: true,
  template: `
    @if (isOpen) {
      <div class="aurora-slash-popup" [style.top.px]="top" [style.left.px]="left">
        <div class="aurora-slash-header">
          <span>Insert element (/{{ query }})</span>
        </div>
        <div class="aurora-slash-list">
          @if (filteredCommands.length === 0) {
            <div class="aurora-slash-empty">
              No matching elements
            </div>
          }
          @for (def of filteredCommands; track def.tagName; let i = $index) {
            <button
              type="button"
              class="aurora-slash-item"
              [class.active]="i === selectedIndex"
              (click)="selectItem(def)"
              (mouseenter)="selectedIndex = i"
            >
              <span class="aurora-slash-icon">&lt;{{ def.tagName }}&gt;</span>
              <div class="aurora-slash-meta">
                <span class="aurora-slash-title">{{ def.displayName }}</span>
                <span class="aurora-slash-desc">{{ def.description }}</span>
              </div>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .aurora-slash-popup {
      position: fixed;
      z-index: 210000;
      width: 280px;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.12);
      overflow: hidden;
      font-family: inherit;
    }
    .aurora-slash-header {
      padding: 6px 10px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    .aurora-slash-list {
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
    }
    .aurora-slash-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 8px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
    }
    .aurora-slash-item.active, .aurora-slash-item:hover {
      background: #f1f5f9;
    }
    .aurora-slash-icon {
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      color: #6366f1;
      min-width: 48px;
    }
    .aurora-slash-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .aurora-slash-title {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    .aurora-slash-desc {
      font-size: 10px;
      color: #64748b;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .aurora-slash-empty {
      padding: 12px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  `]
})
export class AuroraSlashCommandMenuComponent implements OnInit, OnDestroy {
  @Input() query: string = '';
  @Input() top: number = 0;
  @Input() left: number = 0;
  @Input() isOpen: boolean = false;

  public selectedIndex: number = 0;

  constructor(private authoringService: HtmlAuthoringService) {}

  ngOnInit() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  get filteredCommands(): HtmlElementDefinition[] {
    const registry = this.authoringService.getRegistry();
    if (!this.query.trim()) {
      return registry.getAll().filter((d) => d.menu.visibleInStandard).slice(0, 8);
    }
    return registry.search(this.query).slice(0, 8);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, this.filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % Math.max(1, this.filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.filteredCommands[this.selectedIndex]) {
        this.selectItem(this.filteredCommands[this.selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.isOpen = false;
    }
  };

  selectItem(def: HtmlElementDefinition): void {
    this.authoringService.insert(def);
    this.isOpen = false;
  }
}
