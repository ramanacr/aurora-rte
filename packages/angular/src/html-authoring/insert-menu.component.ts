import { Component } from '@angular/core';
import type { ElementCategory, HtmlElementDefinition } from '@aurora/ui';
import { HtmlAuthoringService } from './authoring.service.js';

@Component({
  selector: 'aurora-insert-menu',
  standalone: true,
  template: `
    <div class="aurora-insert-menu-dropdown">
      <div class="aurora-insert-menu-categories">
        @for (cat of categories; track cat) {
          <button
            type="button"
            class="aurora-category-tab"
            [class.active]="selectedCategory === cat"
            (click)="selectCategory(cat)"
          >
            {{ formatCategory(cat) }}
          </button>
        }
      </div>

      <div class="aurora-insert-menu-items">
        @if (items.length === 0) {
          <div class="aurora-empty-state">
            No elements available in this category
          </div>
        }
        @for (def of items; track def.tagName) {
          <button
            type="button"
            class="aurora-insert-item"
            (click)="insertElement(def)"
          >
            <span class="aurora-item-tag">&lt;{{ def.tagName }}&gt;</span>
            <span class="aurora-item-name">{{ def.displayName }}</span>
            <span class="aurora-item-desc">{{ def.description }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .aurora-insert-menu-dropdown {
      display: flex;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      width: 480px;
      max-height: 400px;
      overflow: hidden;
    }
    .aurora-insert-menu-categories {
      width: 140px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .aurora-category-tab {
      border: none;
      background: transparent;
      padding: 8px 10px;
      border-radius: 6px;
      text-align: left;
      font-size: 13px;
      cursor: pointer;
      color: #334155;
    }
    .aurora-category-tab.active, .aurora-category-tab:hover {
      background: #e2e8f0;
      font-weight: 600;
      color: #0f172a;
    }
    .aurora-insert-menu-items {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .aurora-insert-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 8px 10px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }
    .aurora-insert-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .aurora-item-tag {
      font-family: monospace;
      font-size: 11px;
      color: #6366f1;
      font-weight: 600;
    }
    .aurora-item-name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .aurora-item-desc {
      font-size: 11px;
      color: #64748b;
    }
  `]
})
export class AuroraInsertMenuComponent {
  public categories: ElementCategory[] = [
    'basic',
    'text',
    'heading',
    'structure',
    'lists',
    'links',
    'media',
    'tables',
    'forms',
    'interactive',
    'data-code',
    'custom'
  ];

  public selectedCategory: ElementCategory = 'basic';

  constructor(private authoringService: HtmlAuthoringService) {}

  get items(): HtmlElementDefinition[] {
    return this.authoringService.getRegistry().getByCategory(this.selectedCategory);
  }

  selectCategory(cat: ElementCategory): void {
    this.selectedCategory = cat;
  }

  formatCategory(cat: string): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
  }

  insertElement(def: HtmlElementDefinition): void {
    this.authoringService.insert(def);
  }
}
