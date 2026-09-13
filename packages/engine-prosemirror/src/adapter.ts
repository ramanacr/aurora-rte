import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';
import type { AuroraDocument, JsonPatch } from '@aurora/model';
import { validateDocument } from '@aurora/model';
import { auroraSchema } from './schema.js';
import { auroraToProseMirror, proseMirrorToAurora } from './converter.js';
import { diffJson } from './patches.js';

export interface CommandResult {
  success: boolean;
  message?: string;
}

export interface SelectionInfo {
  empty: boolean;
  from: number;
  to: number;
  selectedText?: string;
  activeMarks: string[];
  activeBlockType: string;
}

export interface EngineAdapterOptions {
  document: AuroraDocument;
  element?: HTMLElement | null;
  onChange?: (change: {
    document: AuroraDocument;
    patches: readonly JsonPatch[];
    origin: 'user' | 'command' | 'import' | 'api';
    transactionId: string;
  }) => void;
  onSelectionChange?: (selection: SelectionInfo) => void;
}

export interface EngineAdapter {
  getDocument(): AuroraDocument;
  setDocument(doc: AuroraDocument): void;
  execute(commandName: string, input?: unknown): CommandResult;
  focus(): void;
  destroy(): void;
}

export function createEngineAdapter(options: EngineAdapterOptions): EngineAdapter {
  const initialValidated = validateDocument(options.document);
  let currentAuroraDoc = initialValidated;
  let pmDoc = auroraToProseMirror(initialValidated, auroraSchema);

  let state = EditorState.create({
    doc: pmDoc,
    schema: auroraSchema,
    plugins: [history()]
  });

  let view: EditorView | null = null;
  let isDestroyed = false;

  function dispatchTransaction(tr: Transaction, origin: 'user' | 'command' | 'import' | 'api' = 'user') {
    if (isDestroyed) return;

    state = state.apply(tr);
    if (view) {
      view.updateState(state);
    }

    if (tr.docChanged) {
      const prevDoc = currentAuroraDoc;
      const nextDoc = proseMirrorToAurora(state.doc, prevDoc.meta);
      currentAuroraDoc = nextDoc;
      const patches = diffJson(prevDoc, nextDoc);

      const transactionId =
        (tr.getMeta('transactionId') as string) ||
        `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      options.onChange?.({
        document: nextDoc,
        patches,
        origin,
        transactionId
      });
    }

    if (tr.selectionSet || tr.docChanged || tr.storedMarksSet) {
      const { from, to, empty } = state.selection;
      const marks: string[] = [];
      if (empty) {
        const stored = state.storedMarks || state.selection.$from.marks();
        marks.push(...stored.map((m) => m.type.name));
      } else {
        const selMarks = new Set<string>();
        state.doc.nodesBetween(from, to, (node) => {
          for (const m of node.marks) {
            selMarks.add(m.type.name);
          }
        });
        marks.push(...selMarks);
      }

      const activeBlockType = state.selection.$from.parent.type.name;
      const selectedText = empty ? '' : state.doc.textBetween(from, to);

      options.onSelectionChange?.({
        empty,
        from,
        to,
        selectedText,
        activeMarks: marks,
        activeBlockType
      });
    }
  }

  if (options.element) {
    view = new EditorView(options.element, {
      state,
      dispatchTransaction(tr) {
        dispatchTransaction(tr, 'user');
      }
    });
  }

  function execute(commandName: string, input: unknown = {}): CommandResult {
    if (isDestroyed) {
      return { success: false, message: 'Editor destroyed' };
    }

    const payload = (input || {}) as Record<string, unknown>;
    let executed = false;

    // Helper to dispatch through ProseMirror transaction
    function runPMCommand(cmd: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean): boolean {
      return cmd(state, (tr) => {
        dispatchTransaction(tr, 'command');
      });
    }

    switch (commandName) {
      case 'insertText': {
        const text = String(payload.text || '');
        const tr = state.tr.insertText(text);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'toggleBold':
        executed = runPMCommand(toggleMark(auroraSchema.marks.bold));
        break;

      case 'toggleItalic':
        executed = runPMCommand(toggleMark(auroraSchema.marks.italic));
        break;

      case 'toggleUnderline':
        executed = runPMCommand(toggleMark(auroraSchema.marks.underline));
        break;

      case 'toggleStrike':
        executed = runPMCommand(toggleMark(auroraSchema.marks.strike));
        break;

      case 'toggleCode':
        executed = runPMCommand(toggleMark(auroraSchema.marks.code));
        break;

      case 'toggleSubscript':
        executed = runPMCommand(toggleMark(auroraSchema.marks.subscript));
        break;

      case 'toggleSuperscript':
        executed = runPMCommand(toggleMark(auroraSchema.marks.superscript));
        break;

      case 'setHeading': {
        const level = Number(payload.level || 1);
        executed = runPMCommand(setBlockType(auroraSchema.nodes.heading, { level }));
        break;
      }

      case 'setParagraph':
        executed = runPMCommand(setBlockType(auroraSchema.nodes.paragraph));
        break;

      case 'toggleBlockquote':
        executed = runPMCommand(wrapIn(auroraSchema.nodes.blockquote));
        break;

      case 'toggleCodeBlock': {
        const language = String(payload.language || '');
        executed = runPMCommand(setBlockType(auroraSchema.nodes.code_block, { language }));
        break;
      }

      case 'toggleBulletList':
        executed = runPMCommand(wrapInList(auroraSchema.nodes.bullet_list));
        break;

      case 'toggleOrderedList':
        executed = runPMCommand(wrapInList(auroraSchema.nodes.ordered_list));
        break;

      case 'insertHorizontalRule': {
        const tr = state.tr.replaceSelectionWith(auroraSchema.nodes.horizontal_rule.create());
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'setLink': {
        const href = String(payload.href || '');
        const title = payload.title ? String(payload.title) : null;
        const target = payload.target ? String(payload.target) : null;
        if (!href) {
          executed = runPMCommand(toggleMark(auroraSchema.marks.link));
        } else {
          executed = runPMCommand(
            toggleMark(auroraSchema.marks.link, { href, title, target, rel: 'noopener noreferrer' })
          );
        }
        break;
      }

      case 'removeLink':
        executed = runPMCommand((s, d) => {
          const { from, to } = s.selection;
          if (d) {
            d(s.tr.removeMark(from, to, auroraSchema.marks.link));
          }
          return true;
        });
        break;

      case 'insertImage': {
        const src = String(payload.src || '');
        const alt = String(payload.alt || '');
        const title = String(payload.title || '');
        const node = auroraSchema.nodes.image.create({ src, alt, title });
        const tr = state.tr.replaceSelectionWith(node);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'insertEmbed': {
        const url = String(payload.url || '');
        const provider = String(payload.provider || '');
        const title = String(payload.title || '');
        const node = auroraSchema.nodes.embed.create({ url, provider, title });
        const tr = state.tr.replaceSelectionWith(node);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'insertMention': {
        const id = String(payload.id || '');
        const label = String(payload.label || '');
        const node = auroraSchema.nodes.mention.create({ id, label });
        const tr = state.tr.replaceSelectionWith(node);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'insertCustomBlock': {
        const extensionId = String(payload.extensionId || '');
        const data = (payload.data || {}) as Record<string, unknown>;
        const node = auroraSchema.nodes.custom_block.create({ extensionId, data });
        const tr = state.tr.replaceSelectionWith(node);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'insertTable': {
        const rows = Math.min(Math.max(1, Number(payload.rows || 2)), 100);
        const cols = Math.min(Math.max(1, Number(payload.columns || payload.cols || 2)), 50);

        const tableRows = [];
        for (let r = 0; r < rows; r++) {
          const cells = [];
          for (let c = 0; c < cols; c++) {
            const cellNode =
              r === 0 && payload.header
                ? auroraSchema.nodes.table_header.create(null, [auroraSchema.nodes.paragraph.create()])
                : auroraSchema.nodes.table_cell.create(null, [auroraSchema.nodes.paragraph.create()]);
            cells.push(cellNode);
          }
          tableRows.push(auroraSchema.nodes.table_row.create(null, cells));
        }
        const tableNode = auroraSchema.nodes.table.create({ rows, cols }, tableRows);
        const tr = state.tr.replaceSelectionWith(tableNode);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'undo':
        executed = runPMCommand(undo);
        break;

      case 'redo':
        executed = runPMCommand(redo);
        break;

      default:
        return { success: false, message: `Command "${commandName}" not recognized` };
    }

    return { success: executed };
  }

  return {
    getDocument(): AuroraDocument {
      return proseMirrorToAurora(state.doc, currentAuroraDoc.meta);
    },

    setDocument(newDoc: AuroraDocument): void {
      const validated = validateDocument(newDoc);
      currentAuroraDoc = validated;
      const newPMDoc = auroraToProseMirror(validated, auroraSchema);
      state = EditorState.create({
        doc: newPMDoc,
        schema: auroraSchema,
        plugins: state.plugins
      });
      if (view) {
        view.updateState(state);
      }
      options.onChange?.({
        document: validated,
        patches: [{ op: 'replace', path: '', value: validated }],
        origin: 'api',
        transactionId: `setDoc_${Date.now()}`
      });
    },

    execute,

    focus(): void {
      if (view) {
        view.focus();
      }
    },

    destroy(): void {
      if (!isDestroyed) {
        isDestroyed = true;
        if (view) {
          view.destroy();
          view = null;
        }
      }
    }
  };
}
