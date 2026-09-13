import type { AuroraDocument } from '@aurora/model';
import { validateDocument } from '@aurora/model';
import { createEngineAdapter, type EngineAdapter } from '@aurora/engine-prosemirror';
import { exportHtml } from './html.js';
import { exportMarkdown } from './markdown.js';
import type {
  EditorChange,
  EditorEventMap,
  EditorEventName,
  EditorListener,
  SelectionState,
  Unsubscribe
} from './events.js';
import type { CommandName, CommandResult } from './commands.js';

export interface ExportRequest {
  format: 'html' | 'markdown' | 'text' | 'json';
}

export interface FocusOptions {
  preventScroll?: boolean;
}

export interface HostUploadAdapter {
  uploadFile(file: File): Promise<{ url: string; alt?: string; title?: string }>;
}

export interface EditorOptions {
  document?: AuroraDocument;
  element?: HTMLElement | null;
  upload?: HostUploadAdapter;
  features?: unknown[];
  theme?: {
    preset?: string;
    tokens?: Record<string, string>;
  };
}

export interface AuroraEditor {
  getDocument(): AuroraDocument;
  setDocument(document: AuroraDocument): void;
  execute(name: CommandName | string, input?: unknown): CommandResult;
  export(input: ExportRequest): string;
  focus(options?: FocusOptions): void;
  on<K extends EditorEventName>(event: K, listener: EditorListener<K>): Unsubscribe;
  destroy(): void;
}

export function createEditor(options: EditorOptions = {}): AuroraEditor {
  const initialDocument: AuroraDocument = options.document
    ? validateDocument(options.document)
    : {
        format: 'aurora',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
      };

  const listeners = new Map<EditorEventName, Set<Function>>();

  function emit<K extends EditorEventName>(event: K, payload: EditorEventMap[K]) {
    const handlers = listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          // Prevent listener error from breaking editor
          const errorHandlers = listeners.get('error');
          if (errorHandlers) {
            for (const h of errorHandlers) {
              h({ message: 'Listener error', error: err });
            }
          }
        }
      }
    }
  }

  const adapter: EngineAdapter = createEngineAdapter({
    document: initialDocument,
    element: options.element,
    onChange(change: EditorChange) {
      emit('change', change);
    },
    onSelectionChange(selection: SelectionState) {
      emit('selectionChange', selection);
    }
  });

  return {
    getDocument(): AuroraDocument {
      return adapter.getDocument();
    },

    setDocument(document: AuroraDocument): void {
      const validated = validateDocument(document);
      adapter.setDocument(validated);
    },

    execute(name: CommandName | string, input: unknown = {}): CommandResult {
      return adapter.execute(name, input);
    },

    export(request: ExportRequest): string {
      const doc = adapter.getDocument();
      switch (request.format) {
        case 'html':
          return exportHtml(doc);
        case 'markdown':
          return exportMarkdown(doc);
        case 'json':
          return JSON.stringify(doc, null, 2);
        case 'text': {
          let text = '';
          function extract(nodes: any[]) {
            for (const n of nodes) {
              if (n.type === 'text') text += n.text || '';
              if (n.content) extract(n.content);
              if (['paragraph', 'heading', 'blockquote', 'table_row'].includes(n.type)) {
                text += '\n';
              }
            }
          }
          if (doc.content) extract(doc.content);
          return text.trim();
        }
        default:
          return JSON.stringify(doc);
      }
    },

    focus(_focusOptions?: FocusOptions): void {
      adapter.focus();
      emit('focus', undefined as any);
    },

    on<K extends EditorEventName>(event: K, listener: EditorListener<K>): Unsubscribe {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener as Function);
      return () => {
        listeners.get(event)?.delete(listener as Function);
      };
    },

    destroy(): void {
      emit('destroy', undefined as any);
      listeners.clear();
      adapter.destroy();
    }
  };
}
