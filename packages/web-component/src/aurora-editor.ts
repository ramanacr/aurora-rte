import { createEditor, type AuroraEditor, type CommandName, type ExportRequest } from '@aurora/editor';
import type { AuroraDocument } from '@aurora/model';
import { createToolbar } from '@aurora/ui';

export class AuroraEditorElement extends HTMLElement {
  private editor: AuroraEditor | null = null;
  private root: ShadowRoot | null = null;
  private editorMount: HTMLElement | null = null;
  private toolbarMount: HTMLElement | null = null;
  private toolbarInstance: { destroy: () => void } | null = null;

  static get observedAttributes() {
    return ['toolbar', 'theme'];
  }

  connectedCallback() {
    if (this.root) return;

    this.root = this.attachShadow({ mode: 'open' });

    // Base isolated styling within shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: var(--aurora-font-family, sans-serif);
        color: var(--aurora-fg, #1e293b);
        background: var(--aurora-bg, #ffffff);
        border: 1px solid var(--aurora-border, #cbd5e1);
        border-radius: var(--aurora-radius, 6px);
        overflow: hidden;
      }
      .aurora-wc-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      .aurora-wc-toolbar {
        border-bottom: 1px solid var(--aurora-border, #cbd5e1);
        background: var(--aurora-muted-bg, #f8fafc);
        padding: 4px;
      }
      .aurora-wc-editor {
        padding: 12px;
        min-height: 150px;
        outline: none;
      }
    `;
    this.root.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'aurora-wc-wrapper';

    this.toolbarMount = document.createElement('div');
    this.toolbarMount.className = 'aurora-wc-toolbar';
    wrapper.appendChild(this.toolbarMount);

    this.editorMount = document.createElement('div');
    this.editorMount.className = 'aurora-wc-editor';
    wrapper.appendChild(this.editorMount);

    this.root.appendChild(wrapper);

    // Initialize Editor
    let initialDoc: AuroraDocument | undefined;
    const docAttr = this.getAttribute('document');
    if (docAttr) {
      try {
        initialDoc = JSON.parse(docAttr);
      } catch {}
    }

    this.editor = createEditor({
      element: this.editorMount,
      document: initialDoc
    });

    if (this.getAttribute('toolbar') !== 'false') {
      this.toolbarInstance = createToolbar({
        editor: this.editor,
        container: this.toolbarMount
      });
    } else {
      this.toolbarMount.style.display = 'none';
    }

    this.editor.on('change', (change) => {
      this.dispatchEvent(
        new CustomEvent('aurora-change', {
          detail: change,
          bubbles: true,
          composed: true
        })
      );
    });

    this.editor.on('selectionChange', (sel) => {
      this.dispatchEvent(
        new CustomEvent('aurora-selection-change', {
          detail: sel,
          bubbles: true,
          composed: true
        })
      );
    });

    this.dispatchEvent(new CustomEvent('aurora-ready', { bubbles: true, composed: true }));
  }

  disconnectedCallback() {
    this.toolbarInstance?.destroy();
    this.editor?.destroy();
    this.editor = null;
    this.root = null;
  }

  getDocument(): AuroraDocument | undefined {
    return this.editor?.getDocument();
  }

  setDocument(doc: AuroraDocument): void {
    this.editor?.setDocument(doc);
  }

  execute(name: CommandName | string, input?: unknown) {
    return this.editor?.execute(name, input);
  }

  export(request: ExportRequest): string {
    return this.editor?.export(request) || '';
  }

  focus(): void {
    this.editor?.focus();
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('aurora-editor')) {
  customElements.define('aurora-editor', AuroraEditorElement);
}
