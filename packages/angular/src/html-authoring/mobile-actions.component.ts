import { Component } from '@angular/core';
import type { HtmlElementDefinition } from '@aurora/ui';
import { HtmlAuthoringService } from './authoring.service.js';

@Component({
  selector: 'aurora-mobile-actions',
  standalone: true,
  template: `
    <!-- Bottom Floating Action Bar for Mobile Viewports -->
    <div class="aurora-mobile-bar" role="toolbar" aria-label="Mobile Quick Actions">
      <button type="button" class="aurora-mob-btn" (click)="exec('toggleBold')" title="Bold"><b>B</b></button>
      <button type="button" class="aurora-mob-btn" (click)="exec('toggleItalic')" title="Italic"><i>I</i></button>
      <button type="button" class="aurora-mob-btn" (click)="exec('setHeading', { level: 2 })" title="Heading">H2</button>
      <button type="button" class="aurora-mob-btn" (click)="exec('toggleBulletList')" title="List">•≡</button>
      <button type="button" class="aurora-mob-btn aurora-mob-insert-btn" (click)="toggleSheet()" title="Insert HTML Elements">
        + Add
      </button>
    </div>

    <!-- Mobile Full-Height Bottom Insert Sheet (Doc 07) -->
    @if (isSheetOpen) {
      <div class="aurora-sheet-backdrop" (click)="closeSheet()">
        <div class="aurora-sheet-container" (click)="$event.stopPropagation()">
          <div class="aurora-sheet-handle"></div>
          <div class="aurora-sheet-header">
            <h4>Insert HTML Element</h4>
            <button type="button" class="aurora-sheet-close" (click)="closeSheet()">✕</button>
          </div>

          <div class="aurora-sheet-search">
            <input
              type="text"
              placeholder="Search all elements..."
              [value]="searchQuery"
              (input)="onSearchInput($event)"
            />
          </div>

          <div class="aurora-sheet-body">
            <!-- Favorites -->
            @if (!searchQuery.trim()) {
              <div class="aurora-sheet-section">
                <div class="aurora-section-title">Favorites</div>
                <div class="aurora-chips-row">
                  @for (fav of favoriteElements; track fav.tagName) {
                    <button
                      type="button"
                      class="aurora-chip"
                      (click)="select(fav)"
                    >
                      &lt;{{ fav.tagName }}&gt; {{ fav.displayName }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- All / Search Results -->
            <div class="aurora-sheet-section">
              <div class="aurora-section-title">
                {{ searchQuery.trim() ? 'Search Results' : 'All Elements' }}
              </div>
              <div class="aurora-sheet-list">
                @for (def of displayedElements; track def.tagName) {
                  <button
                    type="button"
                    class="aurora-sheet-item"
                    (click)="select(def)"
                  >
                    <div class="aurora-sheet-item-left">
                      <span class="aurora-tag-pill">&lt;{{ def.tagName }}&gt;</span>
                      <span class="aurora-sheet-name">{{ def.displayName }}</span>
                    </div>
                    <span class="aurora-sheet-desc">{{ def.description }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .aurora-mobile-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 52px;
      background: #ffffff;
      border-top: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 8px;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
      z-index: 99999;
    }
    .aurora-mob-btn {
      flex: 1;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .aurora-mob-btn:active {
      background: #f1f5f9;
    }
    .aurora-mob-insert-btn {
      background: #6366f1;
      color: white;
      font-weight: 600;
      max-width: 80px;
    }
    .aurora-mob-insert-btn:active {
      background: #4f46e5;
    }
    .aurora-sheet-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      z-index: 230000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .aurora-sheet-container {
      background: white;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 25px rgba(0,0,0,0.2);
    }
    .aurora-sheet-handle {
      width: 40px;
      height: 4px;
      background: #cbd5e1;
      border-radius: 2px;
      margin: 8px auto 4px auto;
    }
    .aurora-sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .aurora-sheet-header h4 {
      margin: 0;
      font-size: 16px;
      color: #0f172a;
    }
    .aurora-sheet-close {
      border: none;
      background: transparent;
      font-size: 18px;
      color: #64748b;
      cursor: pointer;
    }
    .aurora-sheet-search {
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .aurora-sheet-search input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 14px;
    }
    .aurora-sheet-body {
      padding: 12px 16px;
      overflow-y: auto;
      max-height: 60vh;
    }
    .aurora-sheet-section {
      margin-bottom: 16px;
    }
    .aurora-section-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 8px;
    }
    .aurora-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .aurora-chip {
      padding: 6px 10px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
    }
    .aurora-sheet-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .aurora-sheet-item {
      display: flex;
      flex-direction: column;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      text-align: left;
      cursor: pointer;
    }
    .aurora-sheet-item-left {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .aurora-tag-pill {
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      color: #6366f1;
    }
    .aurora-sheet-name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .aurora-sheet-desc {
      font-size: 11px;
      color: #64748b;
    }
  `]
})
export class AuroraMobileActionsComponent {
  public isSheetOpen = false;
  public searchQuery = '';

  constructor(private authoringService: HtmlAuthoringService) {}

  get favoriteElements(): HtmlElementDefinition[] {
    const registry = this.authoringService.getRegistry();
    const favs = this.authoringService.getFavorites();
    return favs.map((t) => registry.get(t)).filter((d): d is HtmlElementDefinition => !!d);
  }

  get displayedElements(): HtmlElementDefinition[] {
    const registry = this.authoringService.getRegistry();
    if (this.searchQuery.trim()) {
      return registry.search(this.searchQuery);
    }
    return registry.getAll().slice(0, 20);
  }

  toggleSheet(): void {
    this.isSheetOpen = !this.isSheetOpen;
  }

  closeSheet(): void {
    this.isSheetOpen = false;
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  select(def: HtmlElementDefinition): void {
    this.authoringService.insert(def);
    this.closeSheet();
  }

  exec(command: string, input?: unknown): void {
    const editor = this.authoringService.getEditor();
    editor?.execute(command, input);
  }
}
