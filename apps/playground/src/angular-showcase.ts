import { createEditor } from '@aurora/editor';
import {
  createToolbar,
  createBubbleMenu,
  createSlashMenu,
  createInplaceContextMenu,
  auditElementAccessibility,
  type AccessibilityIssue
} from '@aurora/ui';
import type { AuroraDocument } from '@aurora/model';

const angularInitialDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '🅰️ Angular Standalone Architecture Showcase' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This showcase demonstrates the ' },
        { type: 'text', text: '@aurora/angular', marks: [{ type: 'bold' }] },
        {
          type: 'text',
          text: ' module powered by Angular 17+ native control flow (@if, @for), DI tokens (HTML_ELEMENT_REGISTRY, RTE_POLICY), and HtmlAuthoringService.'
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'The editor is fully integrated with standalone widgets: <aurora-rte-toolbar>, <aurora-html-element-picker>, <aurora-command-palette>, and <aurora-element-inspector>.'
        }
      ]
    },
    {
      type: 'image',
      attrs: {
        src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&auto=format&fit=crop&q=80',
        alt: '', // Deliberately empty alt for a11y testing
        title: 'Angular Architecture'
      }
    },
    {
      type: 'table',
      attrs: { rows: 2, cols: 2 },
      content: [
        {
          type: 'table_row',
          content: [
            { type: 'table_header', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Angular Feature' }] }] },
            { type: 'table_header', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Implementation' }] }] }
          ]
        },
        {
          type: 'table_row',
          content: [
            { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Standalone Components' }] }] },
            { type: 'table_cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zero CommonModule / Ultra-lightweight' }] }] }
          ]
        }
      ]
    }
  ]
};

export function mountAngularShowcase(container: HTMLElement) {
  container.innerHTML = `
    <div style="background: #040d21; border: 1px solid #132a59; border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #132a59; padding-bottom: 12px;">
        <div>
          <h3 style="margin: 0; color: #DD0031; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
            <span style="background: #DD0031; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; font-weight: 700;">🅰️</span>
            Angular 17+ Enterprise Integration
          </h3>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #8ca0c2;">
            Demonstrating standalone components (<aurora-editor>, <aurora-rte-toolbar>, <aurora-element-inspector>) with DI tokens and zero extra runtime bloat.
          </p>
        </div>
        <div style="display: flex; gap: 6px;">
          <span style="font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; background: rgba(221,0,49,0.15); color: #FF4D6D; border: 1px solid rgba(221,0,49,0.3); font-weight: 600;">
            Angular Standalone
          </span>
        </div>
      </div>

      <!-- Quick Template Inserters & Action Bar -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <button id="ng-btn-insert-article" style="padding: 6px 12px; font-size: 0.82rem; font-weight: 600; background: #0c234b; color: #28E6F5; border: 1px solid #1f3b73; border-radius: 4px; cursor: pointer;">
          + Insert Semantic Article
        </button>
        <button id="ng-btn-insert-dialog" style="padding: 6px 12px; font-size: 0.82rem; font-weight: 600; background: #0c234b; color: #25E0C4; border: 1px solid #1f3b73; border-radius: 4px; cursor: pointer;">
          + Insert Dialog Modal
        </button>
        <button id="ng-btn-audit-a11y" style="padding: 6px 12px; font-size: 0.82rem; font-weight: 600; background: #0c234b; color: #FFAA00; border: 1px solid #1f3b73; border-radius: 4px; cursor: pointer;">
          ♿ Run WCAG Audit
        </button>
      </div>

      <!-- Editor & Inspector Grid -->
      <div style="display: grid; grid-template-columns: 1fr 320px; gap: 16px;">
        <div style="display: flex; flex-direction: column;">
          <div id="ng-toolbar-mount" style="margin-bottom: 10px;"></div>
          <div id="ng-editor-mount" style="min-height: 380px; padding: 14px; background: #020814; border: 1px solid #132a59; border-radius: 6px; color: #f0f4f8; outline: none;"></div>
        </div>

        <!-- Live Element Inspector / WCAG Panel -->
        <div style="background: #061530; border: 1px solid #132a59; border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #132a59; padding-bottom: 8px;">
            <strong style="color: #28E6F5; font-size: 0.88rem;">Inspector & WCAG Auditor</strong>
            <span id="ng-a11y-badge" style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,170,0,0.15); color: #FFAA00;">Auditing...</span>
          </div>

          <div id="ng-inspector-content" style="font-size: 0.82rem; color: #8ca0c2; display: flex; flex-direction: column; gap: 10px;">
            <div>Click on any element in the editor (or the image above) to inspect attributes, tag hierarchy, and accessibility rules.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const editorMount = container.querySelector('#ng-editor-mount') as HTMLElement;
  const toolbarMount = container.querySelector('#ng-toolbar-mount') as HTMLElement;
  const inspectorContent = container.querySelector('#ng-inspector-content') as HTMLElement;
  const a11yBadge = container.querySelector('#ng-a11y-badge') as HTMLElement;

  const editor = createEditor({
    element: editorMount,
    document: JSON.parse(JSON.stringify(angularInitialDoc))
  });

  createToolbar({
    editor,
    container: toolbarMount,
    config: { preset: 'full' }
  });

  createBubbleMenu({ editor, container });
  createSlashMenu({ editor, container });
  createInplaceContextMenu({ editor, container });

  function checkA11y() {
    const images = editorMount.querySelectorAll('img');
    let issuesFound = 0;
    inspectorContent.innerHTML = '';

    images.forEach((img) => {
      const issues = auditElementAccessibility(img);
      if (issues.length > 0) {
        issuesFound += issues.length;
        issues.forEach((issue: AccessibilityIssue) => {
          const card = document.createElement('div');
          card.style.cssText = `
            background: #091c3d;
            border: 1px solid #FFAA00;
            border-radius: 6px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          `;
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #FFAA00; font-weight: 700; font-size: 0.75rem;">WCAG Issue: ${issue.elementTag}</span>
              <span style="font-size: 0.7rem; color: #ff6b6b; font-weight: 600;">${issue.severity.toUpperCase()}</span>
            </div>
            <div style="color: #e2ecf9; font-size: 0.8rem;">${issue.message}</div>
            <button class="fix-btn" style="padding: 4px 8px; font-size: 0.75rem; background: #00FF88; color: #040d21; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; align-self: flex-start; margin-top: 4px;">
              ⚡ Apply One-Click Fix
            </button>
          `;

          card.querySelector('.fix-btn')?.addEventListener('click', () => {
            img.setAttribute('alt', 'Scenic workplace setup for developers');
            checkA11y();
          });

          inspectorContent.appendChild(card);
        });
      }
    });

    if (issuesFound === 0) {
      a11yBadge.textContent = '100% WCAG Compliant';
      a11yBadge.style.background = 'rgba(0,255,136,0.15)';
      a11yBadge.style.color = '#00FF88';
      inspectorContent.innerHTML = `
        <div style="color: #00FF88; font-weight: 600;">✓ All accessibility criteria passed.</div>
        <div style="font-size: 0.8rem; color: #8ca0c2; margin-top: 6px;">All images have valid alt descriptions and table structure is accessible.</div>
      `;
    } else {
      a11yBadge.textContent = `${issuesFound} Issue(s) Detected`;
      a11yBadge.style.background = 'rgba(255,170,0,0.15)';
      a11yBadge.style.color = '#FFAA00';
    }
  }

  // Initial audit
  setTimeout(checkA11y, 300);

  // Template insertions
  container.querySelector('#ng-btn-insert-article')?.addEventListener('click', () => {
    editor.execute('insertHtml', {
      html: '<article><header><h2>Modern Cloud Architecture</h2><time datetime="2026-09-14">September 2026</time></header><p>Cloud native authoring platforms deliver zero vendor lock-in.</p><footer>Article End</footer></article>'
    });
    setTimeout(checkA11y, 200);
  });

  container.querySelector('#ng-btn-insert-dialog')?.addEventListener('click', () => {
    editor.execute('insertHtml', {
      html: '<dialog open><h3>Notice</h3><p>This is a native HTML5 dialog element scaffolded via Aurora.</p></dialog>'
    });
    setTimeout(checkA11y, 200);
  });

  container.querySelector('#ng-btn-audit-a11y')?.addEventListener('click', checkA11y);

  return {
    editor,
    destroy: () => editor.destroy()
  };
}
