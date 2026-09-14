import { Component, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import type { AuroraEditor } from '@aurora/editor';
import {
  calculateToolbarLayout,
  type ResponsiveCommandMetadata,
  type ResponsiveBreakpoint
} from '@aurora/ui';
import { HtmlAuthoringService } from './authoring.service.js';

@Component({
  selector: 'aurora-rte-toolbar',
  standalone: true,
  template: `
    <div class="aurora-rte-toolbar-wrapper" [class]="'aurora-bp-' + currentBreakpoint">
      <!-- Main Action Bar -->
      <div class="aurora-rte-toolbar" role="toolbar" aria-label="Editor Formatting Toolbar">
        <!-- Essential actions -->
        <button type="button" class="aurora-tb-btn" (click)="exec('undo')" title="Undo (Ctrl+Z)">↩</button>
        <button type="button" class="aurora-tb-btn" (click)="exec('redo')" title="Redo (Ctrl+Y)">↪</button>
        <div class="aurora-tb-sep"></div>

        <button type="button" class="aurora-tb-btn" (click)="exec('toggleBold')" title="Bold (Ctrl+B)"><b>B</b></button>
        <button type="button" class="aurora-tb-btn" (click)="exec('toggleItalic')" title="Italic (Ctrl+I)"><i>I</i></button>
        <button type="button" class="aurora-tb-btn" (click)="exec('toggleUnderline')" title="Underline (Ctrl+U)"><u>U</u></button>
        <button type="button" class="aurora-tb-btn" (click)="exec('toggleStrike')" title="Strikethrough"><s>S</s></button>
        <div class="aurora-tb-sep"></div>

        <!-- Headings & Structure -->
        @if (isCommandVisible('h1')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('setHeading', { level: 1 })">H1</button>
        }
        @if (isCommandVisible('h2')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('setHeading', { level: 2 })">H2</button>
        }
        @if (isCommandVisible('h3')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('setHeading', { level: 3 })">H3</button>
        }

        <!-- Lists -->
        @if (isCommandVisible('bullet-list')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('toggleBulletList')" title="Bullet List">•≡</button>
        }
        @if (isCommandVisible('ordered-list')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('toggleOrderedList')" title="Numbered List">1≡</button>
        }

        <!-- Table & Media -->
        @if (isCommandVisible('table')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('insertTable', { rows: 3, columns: 3 })" title="Insert Table">▦</button>
        }
        @if (isCommandVisible('quote')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('toggleBlockquote')" title="Quote">❝</button>
        }
        @if (isCommandVisible('code')) {
          <button type="button" class="aurora-tb-btn" (click)="exec('toggleCodeBlock')" title="Code Block">&lt;/&gt;</button>
        }

        <div class="aurora-tb-sep"></div>

        <!-- Tools / Modal Launchers -->
        <button type="button" class="aurora-tb-btn aurora-tb-picker-btn" (click)="openPicker()" title="All HTML Elements Picker">
          🧩 Elements...
        </button>
        <button type="button" class="aurora-tb-btn" (click)="openPalette()" title="Command Palette (Ctrl+K)">
          ⌘K
        </button>

        <!-- Overflow Button -->
        @if (overflowCommands.length > 0) {
          <div class="aurora-tb-overflow-container">
            <button type="button" class="aurora-tb-btn aurora-tb-overflow-btn" (click)="toggleOverflow()">
              •••
            </button>
            @if (isOverflowOpen) {
              <div class="aurora-tb-overflow-dropdown">
                @for (cmdId of overflowCommands; track cmdId) {
                  <button type="button" class="aurora-dropdown-item" (click)="execOverflow(cmdId)">
                    {{ cmdId }}
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .aurora-rte-toolbar-wrapper {
      display: flex;
      width: 100%;
      border-bottom: 1px solid var(--aurora-border, #e2e8f0);
      background: var(--aurora-bg, #ffffff);
    }
    .aurora-rte-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      overflow-x: auto;
      width: 100%;
    }
    .aurora-tb-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      min-width: 32px;
      padding: 0 8px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 14px;
    }
    .aurora-tb-btn:hover {
      background: var(--aurora-btn-hover, #f1f5f9);
    }
    .aurora-tb-sep {
      width: 1px;
      height: 20px;
      background: var(--aurora-border, #e2e8f0);
      margin: 0 4px;
    }
    .aurora-tb-overflow-container {
      position: relative;
      margin-left: auto;
    }
    .aurora-tb-overflow-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 160px;
      padding: 4px 0;
    }
    .aurora-dropdown-item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }
    .aurora-dropdown-item:hover {
      background: #f1f5f9;
    }
  `]
})
export class AuroraRteToolbarComponent implements OnInit, OnDestroy {
  @Input() editor?: AuroraEditor;

  public currentBreakpoint: ResponsiveBreakpoint = 'standard';
  public isOverflowOpen = false;
  public visibleCommands: string[] = [];
  public overflowCommands: string[] = [];

  private resizeObserver: ResizeObserver | null = null;

  private allCommands: ResponsiveCommandMetadata[] = [
    { id: 'h1', priority: 1, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'h2', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'h3', priority: 3, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'bullet-list', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'ordered-list', priority: 3, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'table', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'quote', priority: 4, estimatedWidth: 40, preferredSurface: 'toolbar' },
    { id: 'code', priority: 4, estimatedWidth: 40, preferredSurface: 'toolbar' }
  ];

  constructor(
    private el: ElementRef<HTMLElement>,
    private authoringService: HtmlAuthoringService
  ) {}

  ngOnInit() {
    this.updateLayout(this.el.nativeElement.clientWidth || 1000);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          this.updateLayout(w);
        }
      });
      this.resizeObserver.observe(this.el.nativeElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private updateLayout(width: number) {
    const plan = calculateToolbarLayout(width, this.allCommands);
    this.currentBreakpoint = plan.breakpoint;
    this.visibleCommands = plan.visibleCommandIds;
    this.overflowCommands = plan.overflowCommandIds;
  }

  isCommandVisible(id: string): boolean {
    return this.visibleCommands.includes(id);
  }

  toggleOverflow(): void {
    this.isOverflowOpen = !this.isOverflowOpen;
  }

  exec(commandName: string, input?: unknown): void {
    const activeEditor = this.editor || this.authoringService.getEditor();
    if (activeEditor) {
      activeEditor.execute(commandName, input);
    }
  }

  execOverflow(cmdId: string): void {
    this.isOverflowOpen = false;
    this.exec(cmdId);
  }

  openPicker(): void {
    this.authoringService.isElementPickerOpen = true;
  }

  openPalette(): void {
    this.authoringService.isCommandPaletteOpen = true;
  }
}
