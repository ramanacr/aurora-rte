import { Component } from '@angular/core';
import type { HtmlElementDefinition } from '@aurora/ui';
import { HtmlAuthoringService } from './authoring.service.js';

@Component({
  selector: 'aurora-html-element-picker',
  standalone: true,
  template: `
    @if (authoringService.isElementPickerOpen) {
      <div class="aurora-modal-overlay" (click)="close()">
        <div class="aurora-modal-container" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="aurora-modal-header">
            <h3>🧩 All HTML Elements Picker</h3>
            <button type="button" class="aurora-close-btn" (click)="close()">✕</button>
          </div>

          <!-- Search Input -->
          <div class="aurora-picker-search">
            <input
              type="text"
              placeholder="Search elements by tag, name, aliases, or category (e.g., details, table, quote)..."
              [value]="searchQuery"
              (input)="onSearchInput($event)"
              autofocus
            />
          </div>

          <!-- Section Tabs -->
          <div class="aurora-picker-tabs">
            <button
              type="button"
              class="aurora-tab"
              [class.active]="activeTab === 'all'"
              (click)="setTab('all')"
            >
              Alphabetical ({{ allElements.length }})
            </button>
            <button
              type="button"
              class="aurora-tab"
              [class.active]="activeTab === 'suggested'"
              (click)="setTab('suggested')"
            >
              ★ Suggested for Context
            </button>
            <button
              type="button"
              class="aurora-tab"
              [class.active]="activeTab === 'favorites'"
              (click)="setTab('favorites')"
            >
              ♥ Favorites
            </button>
            <button
              type="button"
              class="aurora-tab"
              [class.active]="activeTab === 'recent'"
              (click)="setTab('recent')"
            >
              ⏱ Recently Used
            </button>
          </div>

          <!-- Elements Grid/List -->
          <div class="aurora-picker-body">
            @if (displayedElements.length === 0) {
              <div class="aurora-picker-empty">
                No matching HTML elements found.
              </div>
            }
            @for (def of displayedElements; track def.tagName) {
              <div
                class="aurora-picker-card"
                (click)="selectElement(def)"
              >
                <div class="aurora-card-top">
                  <span class="aurora-card-tag">&lt;{{ def.tagName }}&gt;</span>
                  <span class="aurora-card-cat">{{ def.category }}</span>
                  <button
                    type="button"
                    class="aurora-fav-toggle"
                    [class.favorited]="isFavorite(def.tagName)"
                    (click)="toggleFavorite($event, def.tagName)"
                    title="Toggle favorite"
                  >
                    ★
                  </button>
                </div>
                <div class="aurora-card-title">{{ def.displayName }}</div>
                <div class="aurora-card-desc">{{ def.description }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .aurora-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 200000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .aurora-modal-container {
      background: white;
      width: 720px;
      max-width: 92vw;
      max-height: 85vh;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .aurora-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .aurora-modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
    }
    .aurora-close-btn {
      border: none;
      background: transparent;
      font-size: 18px;
      cursor: pointer;
      color: #64748b;
    }
    .aurora-picker-search {
      padding: 12px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .aurora-picker-search input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }
    .aurora-picker-search input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .aurora-picker-tabs {
      display: flex;
      padding: 8px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      gap: 8px;
    }
    .aurora-tab {
      border: 1px solid transparent;
      background: transparent;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      color: #475569;
    }
    .aurora-tab.active {
      background: white;
      border-color: #cbd5e1;
      font-weight: 600;
      color: #0f172a;
    }
    .aurora-picker-body {
      padding: 16px 20px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      max-height: 50vh;
    }
    .aurora-picker-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .aurora-picker-card:hover {
      border-color: #6366f1;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .aurora-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .aurora-card-tag {
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      color: #6366f1;
    }
    .aurora-card-cat {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      text-transform: uppercase;
    }
    .aurora-fav-toggle {
      border: none;
      background: transparent;
      color: #cbd5e1;
      cursor: pointer;
      font-size: 14px;
    }
    .aurora-fav-toggle.favorited {
      color: #eab308;
    }
    .aurora-card-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .aurora-card-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }
    .aurora-picker-empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
  `]
})
export class AuroraHtmlElementPickerComponent {
  public searchQuery = '';
  public activeTab: 'all' | 'suggested' | 'favorites' | 'recent' = 'all';

  constructor(public authoringService: HtmlAuthoringService) {}

  get allElements(): HtmlElementDefinition[] {
    return this.authoringService.getRegistry().getAll();
  }

  get displayedElements(): HtmlElementDefinition[] {
    const registry = this.authoringService.getRegistry();

    if (this.searchQuery.trim()) {
      return registry.search(this.searchQuery);
    }

    if (this.activeTab === 'favorites') {
      const favs = this.authoringService.getFavorites();
      return favs.map((t) => registry.get(t)).filter((d): d is HtmlElementDefinition => !!d);
    }

    if (this.activeTab === 'recent') {
      const recents = this.authoringService.getRecentElements();
      return recents.map((t) => registry.get(t)).filter((d): d is HtmlElementDefinition => !!d);
    }

    if (this.activeTab === 'suggested') {
      return this.authoringService.getAvailableElements().sort((a, b) => {
        const scoreA = this.authoringService.evaluateElement(a).score;
        const scoreB = this.authoringService.evaluateElement(b).score;
        return scoreB - scoreA;
      });
    }

    return [...this.allElements].sort((a, b) => a.tagName.localeCompare(b.tagName));
  }

  setTab(tab: 'all' | 'suggested' | 'favorites' | 'recent'): void {
    this.activeTab = tab;
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  close(): void {
    this.authoringService.isElementPickerOpen = false;
  }

  selectElement(def: HtmlElementDefinition): void {
    this.authoringService.insert(def);
    this.close();
  }

  isFavorite(tagName: string): boolean {
    return this.authoringService.getFavorites().includes(tagName.toLowerCase());
  }

  toggleFavorite(event: Event, tagName: string): void {
    event.stopPropagation();
    this.authoringService.toggleFavorite(tagName);
  }
}
