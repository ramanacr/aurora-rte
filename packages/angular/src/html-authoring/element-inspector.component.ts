import { Component } from '@angular/core';
import type { AccessibilityIssue, ElementInspectorData } from '@aurora/ui';
import { HtmlAuthoringService } from './authoring.service.js';

@Component({
  selector: 'aurora-element-inspector',
  standalone: true,
  template: `
    @if (authoringService.isInspectorOpen && data) {
      <div class="aurora-inspector-drawer">
        <div class="aurora-inspector-header">
          <div class="aurora-inspector-title">
            <span class="aurora-inspector-badge">&lt;{{ data.tagName }}&gt;</span>
            <h4>Inspector</h4>
          </div>
          <button type="button" class="aurora-inspector-close" (click)="close()">✕</button>
        </div>

        <div class="aurora-inspector-body">
          <!-- Accessibility Audit Section -->
          <div class="aurora-inspector-section">
            <h5>Accessibility & Quality Audit</h5>
            @if (data.accessibilityIssues.length === 0) {
              <div class="aurora-a11y-good">
                ✓ No accessibility issues detected!
              </div>
            }
            @for (issue of data.accessibilityIssues; track issue.message) {
              <div
                class="aurora-a11y-issue"
                [class]="'aurora-sev-' + issue.severity"
              >
                <div class="aurora-issue-msg">
                  <span class="aurora-issue-sev">{{ issue.severity }}</span>
                  <span>{{ issue.message }}</span>
                </div>
                @if (issue.fixLabel) {
                  <button
                    type="button"
                    class="aurora-autofix-btn"
                    (click)="applyFix(issue)"
                  >
                    🛠 {{ issue.fixLabel }}
                  </button>
                }
              </div>
            }
          </div>

          <!-- Attributes Section -->
          <div class="aurora-inspector-section">
            <h5>Attributes</h5>
            <div class="aurora-attr-row">
              <label>ID:</label>
              <input
                type="text"
                [value]="data.id || ''"
                (input)="updateId($event)"
                placeholder="element-id"
              />
            </div>
            <div class="aurora-attr-row">
              <label>Classes:</label>
              <input
                type="text"
                [value]="data.classes.join(' ')"
                (input)="updateClasses($event)"
                placeholder="class-1 class-2"
              />
            </div>

            <!-- Dynamic Defined Attributes -->
            @for (attr of data.definition?.attributes; track attr.name) {
              <div class="aurora-attr-row">
                <label>{{ attr.name }}:</label>
                <input
                  type="text"
                  [value]="data.attributes[attr.name] || ''"
                  (input)="updateAttribute(attr.name, $event)"
                  [placeholder]="attr.description || attr.type"
                />
              </div>
            }
          </div>

          <!-- HTML Preview Snippet -->
          <div class="aurora-inspector-section">
            <h5>Live HTML Preview</h5>
            <pre class="aurora-html-snippet"><code>{{ data.htmlPreview }}</code></pre>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .aurora-inspector-drawer {
      position: fixed;
      top: 60px;
      right: 0;
      width: 320px;
      height: calc(100vh - 60px);
      background: #ffffff;
      border-left: 1px solid #cbd5e1;
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
      z-index: 100000;
      display: flex;
      flex-direction: column;
      font-family: inherit;
    }
    .aurora-inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .aurora-inspector-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .aurora-inspector-title h4 {
      margin: 0;
      font-size: 15px;
      color: #0f172a;
    }
    .aurora-inspector-badge {
      font-family: monospace;
      font-size: 11px;
      background: #e0e7ff;
      color: #4338ca;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
    }
    .aurora-inspector-close {
      border: none;
      background: transparent;
      font-size: 16px;
      cursor: pointer;
      color: #64748b;
    }
    .aurora-inspector-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .aurora-inspector-section h5 {
      margin: 0 0 8px 0;
      font-size: 12px;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.05em;
    }
    .aurora-a11y-good {
      padding: 8px 12px;
      background: #ecfdf5;
      color: #047857;
      border-radius: 6px;
      font-size: 12px;
    }
    .aurora-a11y-issue {
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .aurora-sev-error {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      color: #991b1b;
    }
    .aurora-sev-warning {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      color: #92400e;
    }
    .aurora-sev-info {
      background: #f0f9ff;
      border-left: 3px solid #0284c7;
      color: #075985;
    }
    .aurora-issue-sev {
      text-transform: uppercase;
      font-weight: bold;
      font-size: 9px;
      margin-right: 6px;
    }
    .aurora-autofix-btn {
      margin-top: 6px;
      padding: 4px 8px;
      border: 1px solid #cbd5e1;
      background: white;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      font-weight: 600;
    }
    .aurora-attr-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 10px;
    }
    .aurora-attr-row label {
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
    }
    .aurora-attr-row input {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 12px;
    }
    .aurora-html-snippet {
      background: #0f172a;
      color: #38bdf8;
      padding: 10px;
      border-radius: 6px;
      font-size: 11px;
      overflow-x: auto;
      max-height: 140px;
    }
  `]
})
export class AuroraElementInspectorComponent {
  constructor(public authoringService: HtmlAuthoringService) {}

  get data(): ElementInspectorData | null {
    return this.authoringService.inspectorData;
  }

  close() {
    this.authoringService.closeInspector();
  }

  applyFix(issue: AccessibilityIssue) {
    this.authoringService.applyFix(issue);
  }

  updateId(event: Event) {
    const id = (event.target as HTMLInputElement).value;
    if (this.authoringService.selectedElementForInspector) {
      this.authoringService.selectedElementForInspector.id = id;
      this.refresh();
    }
  }

  updateClasses(event: Event) {
    const classes = (event.target as HTMLInputElement).value;
    if (this.authoringService.selectedElementForInspector) {
      this.authoringService.selectedElementForInspector.className = classes;
      this.refresh();
    }
  }

  updateAttribute(name: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.authoringService.selectedElementForInspector) {
      if (value) {
        this.authoringService.selectedElementForInspector.setAttribute(name, value);
      } else {
        this.authoringService.selectedElementForInspector.removeAttribute(name);
      }
      this.refresh();
    }
  }

  private refresh() {
    if (this.authoringService.selectedElementForInspector) {
      this.authoringService.inspect(this.authoringService.selectedElementForInspector);
    }
  }
}
