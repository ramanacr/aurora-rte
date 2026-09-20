import { EditorState, Transaction, NodeSelection, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import {
  baseKeymap,
  chainCommands,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
  joinForward,
  selectNodeForward,
  toggleMark,
  setBlockType,
  wrapIn,
  lift
} from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';

type Command = (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;
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
  activeAlignment?: string;
  activeFontFamily?: string;
  activeFontSize?: string;
  isInTable?: boolean;
  activeLinkAttrs?: { href: string; title?: string; target?: string };
  selectedNodeType?: string;
  selectedNodeAttrs?: Record<string, unknown>;
}

export interface EngineAdapterOptions {
  document: AuroraDocument;
  element?: HTMLElement | null;
  editable?: boolean;
  onChange?: (change: {
    document: AuroraDocument;
    patches: readonly JsonPatch[];
    origin: 'user' | 'command' | 'import' | 'api';
    transactionId: string;
  }) => void;
  onSelectionChange?: (selection: SelectionInfo) => void;
  onPasteImage?: (file: File) => Promise<{ src: string; alt?: string; title?: string } | void> | void;
}

export interface EngineAdapter {
  getDocument(): AuroraDocument;
  setDocument(doc: AuroraDocument): void;
  execute(commandName: string, input?: unknown): CommandResult;
  focus(): void;
  destroy(): void;
  isEditable(): boolean;
  setEditable(editable: boolean): void;
}

const deleteTableCommand: Command = (state, dispatch) => {
  const { $from, from: selFrom } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type === auroraSchema.nodes.table) {
      if (dispatch) {
        const from = $from.before(d);
        const to = $from.after(d);
        const tr = state.tr.delete(from, to);
        if (tr.doc.content.size === 0) {
          tr.insert(0, auroraSchema.nodes.paragraph.create());
        }
        dispatch(tr);
      }
      return true;
    }
  }

  if ($from.nodeAfter && $from.nodeAfter.type === auroraSchema.nodes.table) {
    if (dispatch) {
      const tr = state.tr.delete(selFrom, selFrom + $from.nodeAfter.nodeSize);
      if (tr.doc.content.size === 0) {
        tr.insert(0, auroraSchema.nodes.paragraph.create());
      }
      dispatch(tr);
    }
    return true;
  }

  if ($from.nodeBefore && $from.nodeBefore.type === auroraSchema.nodes.table) {
    if (dispatch) {
      const tr = state.tr.delete(selFrom - $from.nodeBefore.nodeSize, selFrom);
      if (tr.doc.content.size === 0) {
        tr.insert(0, auroraSchema.nodes.paragraph.create());
      }
      dispatch(tr);
    }
    return true;
  }

  let nearestTable: { from: number; to: number } | null = null;
  state.doc.descendants((node, pos) => {
    if (node.type === auroraSchema.nodes.table) {
      if (!nearestTable || Math.abs(pos - selFrom) < Math.abs(nearestTable.from - selFrom)) {
        nearestTable = { from: pos, to: pos + node.nodeSize };
      }
    }
  });

  const targetTable = nearestTable as { from: number; to: number } | null;
  if (targetTable && dispatch) {
    const tr = state.tr.delete(targetTable.from, targetTable.to);
    if (tr.doc.content.size === 0) {
      tr.insert(0, auroraSchema.nodes.paragraph.create());
    }
    dispatch(tr);
    return true;
  }

  return false;
};

const smartBackspace: Command = chainCommands(
  deleteSelection,
  (state, dispatch) => {
    const { $from, empty } = state.selection;
    if (!empty) return false;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type === auroraSchema.nodes.table) {
        const tableNode = $from.node(d);
        if ($from.parentOffset === 0 && tableNode.textContent.trim() === '') {
          return deleteTableCommand(state, dispatch);
        }
      }
    }
    return false;
  },
  joinBackward,
  selectNodeBackward
);

const smartDelete: Command = chainCommands(
  deleteSelection,
  (state, dispatch) => {
    const { $from, empty } = state.selection;
    if (!empty) return false;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type === auroraSchema.nodes.table) {
        const tableNode = $from.node(d);
        if (tableNode.textContent.trim() === '') {
          return deleteTableCommand(state, dispatch);
        }
      }
    }
    return false;
  },
  joinForward,
  selectNodeForward
);

export function createEngineAdapter(options: EngineAdapterOptions): EngineAdapter {
  const initialValidated = validateDocument(options.document);
  let currentAuroraDoc = initialValidated;
  let pmDoc = auroraToProseMirror(initialValidated, auroraSchema);

  const plugins = [
    history(),
    keymap({
      'Mod-z': undo,
      'Mod-y': redo,
      'Shift-Mod-z': redo,
      'Backspace': smartBackspace,
      'Delete': smartDelete
    }),
    keymap(baseKeymap)
  ];

  let state = EditorState.create({
    doc: pmDoc,
    schema: auroraSchema,
    plugins
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

      let activeFontFamily: string | undefined;
      let activeFontSize: string | undefined;
      const checkMarks = empty
        ? state.storedMarks || state.selection.$from.marks()
        : state.selection.$from.marks();

      for (const m of checkMarks) {
        if (m.type.name === 'fontFamily' && m.attrs.family) {
          activeFontFamily = m.attrs.family;
        }
        if (m.type.name === 'fontSize' && m.attrs.size) {
          activeFontSize = m.attrs.size;
        }
      }

      let activeLinkAttrs: { href: string; title?: string; target?: string } | undefined;
      for (const m of checkMarks) {
        if (m.type.name === 'link' && m.attrs.href) {
          activeLinkAttrs = {
            href: m.attrs.href,
            title: m.attrs.title || undefined,
            target: m.attrs.target || undefined
          };
          break;
        }
      }

      let isInTable = false;
      for (let d = state.selection.$from.depth; d > 0; d--) {
        const typeName = state.selection.$from.node(d).type.name;
        if (typeName === 'table' || typeName === 'table_row' || typeName === 'table_cell' || typeName === 'table_header') {
          isInTable = true;
          break;
        }
      }

      let selectedNodeType: string | undefined;
      let selectedNodeAttrs: Record<string, unknown> | undefined;
      if (state.selection instanceof NodeSelection) {
        selectedNodeType = state.selection.node.type.name;
        selectedNodeAttrs = state.selection.node.attrs;
      }

      const activeBlockType = state.selection.$from.parent.type.name;
      const activeAlignment = (state.selection.$from.parent.attrs.align as string) || 'left';
      const selectedText = empty ? '' : state.doc.textBetween(from, to);

      options.onSelectionChange?.({
        empty,
        from,
        to,
        selectedText,
        activeMarks: marks,
        activeBlockType,
        activeAlignment,
        activeFontFamily,
        activeFontSize,
        isInTable,
        activeLinkAttrs,
        selectedNodeType,
        selectedNodeAttrs
      });
    }
  }

  let isEditable = options.editable !== false;

  if (options.element) {
    if (!isEditable) {
      options.element.setAttribute('data-readonly', 'true');
      options.element.classList.add('aurora-readonly');
    }

    view = new EditorView(options.element, {
      state,
      editable: () => isEditable,
      dispatchTransaction(tr) {
        dispatchTransaction(tr, 'user');
      },
      handleDOMEvents: {
        contextmenu(v: EditorView, event: Event) {
          if (!isEditable) {
            return false;
          }
          const mouseEvent = event as MouseEvent;
          const pos = v.posAtCoords({ left: mouseEvent.clientX, top: mouseEvent.clientY });
          if (pos) {
            const sel = v.state.selection;
            const targetNode = v.state.doc.nodeAt(pos.pos);
            if (targetNode && targetNode.type === auroraSchema.nodes.image) {
              v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, pos.pos)));
            } else if (sel.empty || pos.pos < sel.from || pos.pos > sel.to) {
              v.dispatch(v.state.tr.setSelection(Selection.near(v.state.doc.resolve(pos.pos))));
            }
          }
          return false;
        }
      },
      handleClickOn(view, _pos, node, nodePos) {
        if (!isEditable) {
          return false;
        }
        if (node.type === auroraSchema.nodes.image) {
          view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePos)));
          return true;
        }
        return false;
      },
      handlePaste(_view, event) {
        if (!isEditable) {
          return false;
        }
        const items = event.clipboardData?.items;
        const files = event.clipboardData?.files;

        let imageFile: File | null = null;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
              imageFile = files[i];
              break;
            }
          }
        }
        if (!imageFile && items && items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              imageFile = items[i].getAsFile();
              break;
            }
          }
        }

        if (imageFile) {
          event.preventDefault();
          if (options.onPasteImage) {
            Promise.resolve(options.onPasteImage(imageFile)).then((res) => {
              if (res && res.src) {
                execute('insertImage', res);
              }
            });
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                execute('insertImage', {
                  src: reader.result,
                  alt: imageFile?.name || 'Pasted image'
                });
              }
            };
            reader.readAsDataURL(imageFile);
          }
          return true;
        }
        return false;
      },
      handleDrop(_view, event) {
        if (!isEditable) {
          return false;
        }
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
              event.preventDefault();
              const file = files[i];
              if (options.onPasteImage) {
                Promise.resolve(options.onPasteImage(file)).then((res) => {
                  if (res && res.src) {
                    execute('insertImage', res);
                  }
                });
              } else {
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    execute('insertImage', {
                      src: reader.result,
                      alt: file.name || 'Dropped image'
                    });
                  }
                };
                reader.readAsDataURL(file);
              }
              return true;
            }
          }
        }
        return false;
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

      case 'setTextAlign':
      case 'alignLeft':
      case 'alignCenter':
      case 'alignRight':
      case 'alignJustify': {
        const align =
          commandName === 'alignLeft'
            ? 'left'
            : commandName === 'alignCenter'
            ? 'center'
            : commandName === 'alignRight'
            ? 'right'
            : commandName === 'alignJustify'
            ? 'justify'
            : String(payload.alignment || payload.align || 'left');

        executed = runPMCommand((state, dispatch) => {
          const { from, to } = state.selection;
          let tr = state.tr;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type === auroraSchema.nodes.paragraph || node.type === auroraSchema.nodes.heading) {
              tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, align });
              changed = true;
            }
          });
          if (changed && dispatch) {
            dispatch(tr);
            return true;
          }
          return changed;
        });
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
          const mark = auroraSchema.marks.link.create({ href, title, target, rel: 'noopener noreferrer' });
          if (state.selection.empty) {
            const text = payload.text ? String(payload.text) : href;
            const textNode = auroraSchema.text(text, [mark]);
            const tr = state.tr.replaceSelectionWith(textNode, false);
            dispatchTransaction(tr, 'command');
            executed = true;
          } else {
            const { from, to } = state.selection;
            const tr = state.tr.addMark(from, to, mark);
            dispatchTransaction(tr, 'command');
            executed = true;
          }
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
        const width = payload.width || null;
        const height = payload.height || null;
        const align = payload.align || 'center';
        const rounded = Boolean(payload.rounded);
        const shadow = Boolean(payload.shadow);
        const border = Boolean(payload.border);
        const linkUrl = String(payload.linkUrl || '');
        if (src) {
          const node = auroraSchema.nodes.image.create({
            src,
            alt,
            title,
            width,
            height,
            align,
            rounded,
            shadow,
            border,
            linkUrl
          });
          const tr = state.tr.replaceSelectionWith(node);
          dispatchTransaction(tr, 'command');
          executed = true;
        }
        break;
      }

      case 'deleteImage': {
        executed = runPMCommand((s, dispatch) => {
          if (s.selection instanceof NodeSelection && s.selection.node.type === auroraSchema.nodes.image) {
            if (dispatch) dispatch(s.tr.deleteSelection());
            return true;
          }
          const pos = typeof (payload as any)?.pos === 'number' ? (payload as any).pos : null;
          if (pos !== null) {
            const node = s.doc.nodeAt(pos);
            if (node && node.type === auroraSchema.nodes.image) {
              if (dispatch) dispatch(s.tr.delete(pos, pos + node.nodeSize));
              return true;
            }
          }
          return false;
        });
        break;
      }

      case 'updateImage': {
        const {
          src,
          alt,
          title,
          width,
          height,
          aspectRatio,
          sizingMode,
          lockAspectRatio,
          objectFit,
          align,
          rounded,
          shadow,
          border,
          linkUrl,
          pos
        } = (payload || {}) as {
          src?: string;
          alt?: string;
          title?: string;
          width?: string | number | null;
          height?: string | number | null;
          aspectRatio?: string | null;
          sizingMode?: 'responsive' | 'fixed';
          lockAspectRatio?: boolean;
          objectFit?: string;
          align?: string;
          rounded?: boolean;
          shadow?: boolean;
          border?: boolean;
          linkUrl?: string;
          pos?: number;
        };
        executed = runPMCommand((s, dispatch) => {
          let targetPos: number | null = typeof pos === 'number' ? pos : null;
          let targetNode: any = null;

          if (targetPos === null && s.selection instanceof NodeSelection && s.selection.node.type === auroraSchema.nodes.image) {
            targetPos = s.selection.from;
            targetNode = s.selection.node;
          } else if (targetPos !== null) {
            targetNode = s.doc.nodeAt(targetPos);
          }

          if ((targetPos === null || !targetNode) && src) {
            s.doc.descendants((node, p) => {
              if (node.type === auroraSchema.nodes.image && node.attrs.src === src) {
                targetPos = p;
                targetNode = node;
                return false;
              }
              return true;
            });
          }

          if (targetPos !== null && targetNode && targetNode.type === auroraSchema.nodes.image) {
            if (dispatch) {
              const nextAttrs = {
                ...targetNode.attrs,
                ...(src !== undefined ? { src } : {}),
                ...(alt !== undefined ? { alt } : {}),
                ...(title !== undefined ? { title } : {}),
                ...(width !== undefined ? { width } : {}),
                ...(height !== undefined ? { height } : {}),
                ...(aspectRatio !== undefined ? { aspectRatio } : {}),
                ...(sizingMode !== undefined ? { sizingMode } : {}),
                ...(lockAspectRatio !== undefined ? { lockAspectRatio } : {}),
                ...(objectFit !== undefined ? { objectFit } : {}),
                ...(align !== undefined ? { align } : {}),
                ...(rounded !== undefined ? { rounded } : {}),
                ...(shadow !== undefined ? { shadow } : {}),
                ...(border !== undefined ? { border } : {}),
                ...(linkUrl !== undefined ? { linkUrl } : {})
              };
              dispatch(s.tr.setNodeMarkup(targetPos, undefined, nextAttrs));
            }
            return true;
          }
          return false;
        });
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

      case 'deleteTable':
        executed = runPMCommand(deleteTableCommand);
        break;

      case 'addTableRowAbove':
      case 'addTableRowBelow': {
        const insertAbove = commandName === 'addTableRowAbove';
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          let rowDepth = -1;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === auroraSchema.nodes.table_row) rowDepth = d;
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }
          if (tableDepth === -1 || rowDepth === -1) return false;
          if (dispatch) {
            const rowNode = $from.node(rowDepth);
            const cols = rowNode.childCount;
            const newCells = [];
            for (let c = 0; c < cols; c++) {
              newCells.push(auroraSchema.nodes.table_cell.create(null, [auroraSchema.nodes.paragraph.create()]));
            }
            const newRow = auroraSchema.nodes.table_row.create(null, newCells);
            const pos = insertAbove ? $from.before(rowDepth) : $from.after(rowDepth);
            const tr = state.tr.insert(pos, newRow);
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'deleteTableRow': {
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          let rowDepth = -1;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === auroraSchema.nodes.table_row) rowDepth = d;
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }
          if (tableDepth === -1 || rowDepth === -1) return false;
          const tableNode = $from.node(tableDepth);
          if (tableNode.childCount <= 1) {
            return deleteTableCommand(state, dispatch);
          }
          if (dispatch) {
            const tr = state.tr.delete($from.before(rowDepth), $from.after(rowDepth));
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'addTableColBefore':
      case 'addTableColAfter': {
        const insertBefore = commandName === 'addTableColBefore';
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          let cellIndex = -1;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === auroraSchema.nodes.table_cell || $from.node(d).type === auroraSchema.nodes.table_header) {
              cellIndex = $from.index(d - 1);
            }
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }
          if (tableDepth === -1 || cellIndex === -1) return false;
          if (dispatch) {
            let tr = state.tr;
            const tablePos = $from.before(tableDepth);
            const tableNode = state.doc.nodeAt(tablePos);
            if (!tableNode) return false;

            let offset = tablePos + 1;
            for (let r = 0; r < tableNode.childCount; r++) {
              const row = tableNode.child(r);
              const targetCol = insertBefore ? cellIndex : cellIndex + 1;
              let currentCellIdx = 0;
              let insertPos = offset;
              row.forEach((_cell, cellOffset) => {
                if (currentCellIdx === targetCol) {
                  insertPos = offset + cellOffset;
                }
                currentCellIdx++;
              });
              if (targetCol >= row.childCount) {
                insertPos = offset + row.content.size;
              }
              const isHeaderRow = row.child(0)?.type === auroraSchema.nodes.table_header;
              const newCell = isHeaderRow
                ? auroraSchema.nodes.table_header.create(null, [auroraSchema.nodes.paragraph.create()])
                : auroraSchema.nodes.table_cell.create(null, [auroraSchema.nodes.paragraph.create()]);

              tr = tr.insert(insertPos, newCell);
              offset += row.nodeSize + newCell.nodeSize;
            }
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'deleteTableCol': {
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          let cellIndex = -1;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === auroraSchema.nodes.table_cell || $from.node(d).type === auroraSchema.nodes.table_header) {
              cellIndex = $from.index(d - 1);
            }
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }
          if (tableDepth === -1 || cellIndex === -1) return false;
          const tableNode = $from.node(tableDepth);
          if (tableNode.child(0).childCount <= 1) {
            return deleteTableCommand(state, dispatch);
          }
          if (dispatch) {
            let tr = state.tr;
            const tablePos = $from.before(tableDepth);
            let offset = tablePos + 1;
            for (let r = 0; r < tableNode.childCount; r++) {
              const row = tableNode.child(r);
              let currentCellIdx = 0;
              let cellPos = -1;
              let cellSize = 0;
              row.forEach((cell, cellOffset) => {
                if (currentCellIdx === cellIndex) {
                  cellPos = offset + cellOffset;
                  cellSize = cell.nodeSize;
                }
                currentCellIdx++;
              });
              if (cellPos !== -1) {
                tr = tr.delete(cellPos, cellPos + cellSize);
                offset += row.nodeSize - cellSize;
              } else {
                offset += row.nodeSize;
              }
            }
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'updateTable': {
        const tableAttrs = payload as {
          tableWidth?: string;
          bordered?: boolean;
          striped?: boolean;
          headerRow?: boolean;
        };
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }
          let tablePos = tableDepth !== -1 ? $from.before(tableDepth) : -1;
          if (tablePos === -1) {
            if (state.selection instanceof NodeSelection && state.selection.node.type === auroraSchema.nodes.table) {
              tablePos = state.selection.from;
            } else {
              state.doc.descendants((node, pos) => {
                if (tablePos === -1 && node.type === auroraSchema.nodes.table) {
                  tablePos = pos;
                  return false;
                }
                return true;
              });
            }
          }
          if (tablePos === -1) return false;
          if (dispatch) {
            const tableNode = state.doc.nodeAt(tablePos);
            if (!tableNode) return false;
            const nextAttrs = {
              ...tableNode.attrs,
              ...(tableAttrs.tableWidth !== undefined ? { tableWidth: tableAttrs.tableWidth } : {}),
              ...(tableAttrs.bordered !== undefined ? { bordered: tableAttrs.bordered } : {}),
              ...(tableAttrs.striped !== undefined ? { striped: tableAttrs.striped } : {}),
              ...(tableAttrs.headerRow !== undefined ? { headerRow: tableAttrs.headerRow } : {})
            };
            dispatch(state.tr.setNodeMarkup(tablePos, undefined, nextAttrs));
          }
          return true;
        });
        break;
      }

      case 'updateTableCell': {
        const cellAttrs = payload as {
          background?: string | null;
          align?: 'left' | 'center' | 'right' | null;
          colwidth?: string | number | null;
        };
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let cellDepth = -1;
          for (let d = $from.depth; d > 0; d--) {
            const nodeType = $from.node(d).type;
            if (nodeType === auroraSchema.nodes.table_cell || nodeType === auroraSchema.nodes.table_header) {
              cellDepth = d;
              break;
            }
          }
          let cellPos = cellDepth !== -1 ? $from.before(cellDepth) : -1;
          if (cellPos === -1) {
            if (state.selection instanceof NodeSelection) {
              const nType = state.selection.node.type;
              if (nType === auroraSchema.nodes.table_cell || nType === auroraSchema.nodes.table_header) {
                cellPos = state.selection.from;
              }
            } else {
              state.doc.descendants((node, pos) => {
                if (cellPos === -1 && (node.type === auroraSchema.nodes.table_cell || node.type === auroraSchema.nodes.table_header)) {
                  cellPos = pos;
                  return false;
                }
                return true;
              });
            }
          }
          if (cellPos === -1) return false;
          if (dispatch) {
            const cellNode = state.doc.nodeAt(cellPos);
            if (!cellNode) return false;
            const nextAttrs = {
              ...cellNode.attrs,
              ...(cellAttrs.background !== undefined ? { background: cellAttrs.background } : {}),
              ...(cellAttrs.align !== undefined ? { align: cellAttrs.align } : {}),
              ...(cellAttrs.colwidth !== undefined ? { colwidth: cellAttrs.colwidth } : {})
            };
            dispatch(state.tr.setNodeMarkup(cellPos, undefined, nextAttrs));
          }
          return true;
        });
        break;
      }

      case 'updateTableRow':
      case 'setTableRowHeight': {
        const { rowIndex, height, allRows } = (payload || {}) as {
          rowIndex?: number;
          height?: string | number | null;
          allRows?: boolean;
        };
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          let targetRow = rowIndex !== undefined ? rowIndex : -1;

          for (let d = $from.depth; d > 0; d--) {
            if (targetRow === -1 && $from.node(d).type === auroraSchema.nodes.table_row) {
              targetRow = $from.index(d - 1);
            }
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }

          let tablePos = tableDepth !== -1 ? $from.before(tableDepth) : -1;
          if (tablePos === -1) {
            state.doc.descendants((node, pos) => {
              if (tablePos === -1 && node.type === auroraSchema.nodes.table) {
                tablePos = pos;
                return false;
              }
              return true;
            });
          }

          if (tablePos === -1) return false;
          if (dispatch) {
            let tr = state.tr;
            const tableNode = state.doc.nodeAt(tablePos);
            if (!tableNode) return false;

            let offset = tablePos + 1;
            for (let r = 0; r < tableNode.childCount; r++) {
              const row = tableNode.child(r);
              const rowPos = offset;
              if (allRows || r === (targetRow !== -1 ? targetRow : 0)) {
                const nextAttrs = {
                  ...row.attrs,
                  height: height !== undefined ? height : null
                };
                tr = tr.setNodeMarkup(rowPos, undefined, nextAttrs);
              }
              offset += row.nodeSize;
            }
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'setTableColWidth': {
        const { colIndex, width } = (payload || {}) as { colIndex?: number; width: string | number | null };
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          let targetCol = colIndex !== undefined ? colIndex : -1;

          for (let d = $from.depth; d > 0; d--) {
            if (targetCol === -1 && ($from.node(d).type === auroraSchema.nodes.table_cell || $from.node(d).type === auroraSchema.nodes.table_header)) {
              targetCol = $from.index(d - 1);
            }
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }

          let tablePos = tableDepth !== -1 ? $from.before(tableDepth) : -1;
          if (tablePos === -1) {
            state.doc.descendants((node, pos) => {
              if (tablePos === -1 && node.type === auroraSchema.nodes.table) {
                tablePos = pos;
                return false;
              }
              return true;
            });
          }

          if (tablePos === -1) return false;
          const actualCol = targetCol !== -1 ? targetCol : 0;

          if (dispatch) {
            let tr = state.tr;
            const tableNode = state.doc.nodeAt(tablePos);
            if (!tableNode) return false;

            let offset = tablePos + 1;
            for (let r = 0; r < tableNode.childCount; r++) {
              const row = tableNode.child(r);
              let cIdx = 0;
              let cellPos = -1;
              let currentCellNode: any = null;

              row.forEach((cell, cellOffset) => {
                if (cIdx === actualCol) {
                  cellPos = offset + 1 + cellOffset;
                  currentCellNode = cell;
                }
                cIdx++;
              });

              if (cellPos !== -1 && currentCellNode) {
                const nextAttrs = {
                  ...currentCellNode.attrs,
                  colwidth: width !== undefined ? width : null
                };
                tr = tr.setNodeMarkup(cellPos, undefined, nextAttrs);
              }
              offset += row.nodeSize;
            }
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'distributeTableCols': {
        executed = runPMCommand((state, dispatch) => {
          const { $from } = state.selection;
          let tableDepth = -1;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type === auroraSchema.nodes.table) {
              tableDepth = d;
              break;
            }
          }

          let tablePos = tableDepth !== -1 ? $from.before(tableDepth) : -1;
          if (tablePos === -1) {
            state.doc.descendants((node, pos) => {
              if (tablePos === -1 && node.type === auroraSchema.nodes.table) {
                tablePos = pos;
                return false;
              }
              return true;
            });
          }

          if (tablePos === -1) return false;
          if (dispatch) {
            let tr = state.tr;
            const tableNode = state.doc.nodeAt(tablePos);
            if (!tableNode) return false;

            const colCount = tableNode.child(0)?.childCount || 1;
            const evenWidth = `${Math.floor(100 / colCount)}%`;

            let offset = tablePos + 1;
            for (let r = 0; r < tableNode.childCount; r++) {
              const row = tableNode.child(r);
              row.forEach((cell, cellOffset) => {
                const cellPos = offset + 1 + cellOffset;
                tr = tr.setNodeMarkup(cellPos, undefined, {
                  ...cell.attrs,
                  colwidth: evenWidth
                });
              });
              offset += row.nodeSize;
            }
            dispatch(tr);
          }
          return true;
        });
        break;
      }

      case 'setTextColor': {
        const color = payload.color ? String(payload.color) : null;
        if (!color) {
          executed = runPMCommand((s, d) => {
            const { from, to } = s.selection;
            if (d) d(s.tr.removeMark(from, to, auroraSchema.marks.textColor));
            return true;
          });
        } else {
          const mark = auroraSchema.marks.textColor.create({ color });
          executed = runPMCommand((s, d) => {
            const { from, to } = s.selection;
            if (d) {
              const tr = s.tr.removeMark(from, to, auroraSchema.marks.textColor).addMark(from, to, mark);
              d(tr);
            }
            return true;
          });
        }
        break;
      }

      case 'setTextHighlight': {
        const color = payload.color ? String(payload.color) : null;
        if (!color) {
          executed = runPMCommand((s, d) => {
            const { from, to } = s.selection;
            if (d) d(s.tr.removeMark(from, to, auroraSchema.marks.textHighlight));
            return true;
          });
        } else {
          const mark = auroraSchema.marks.textHighlight.create({ color });
          executed = runPMCommand((s, d) => {
            const { from, to } = s.selection;
            if (d) {
              const tr = s.tr.removeMark(from, to, auroraSchema.marks.textHighlight).addMark(from, to, mark);
              d(tr);
            }
            return true;
          });
        }
        break;
      }

      case 'setFontFamily': {
        const family = payload.family ? String(payload.family) : null;
        if (!family) {
          executed = runPMCommand((s, d) => {
            const { from, to, empty } = s.selection;
            if (empty) {
              if (d) d(s.tr.removeStoredMark(auroraSchema.marks.fontFamily));
            } else {
              if (d) d(s.tr.removeMark(from, to, auroraSchema.marks.fontFamily));
            }
            return true;
          });
        } else {
          const mark = auroraSchema.marks.fontFamily.create({ family });
          executed = runPMCommand((s, d) => {
            const { from, to, empty } = s.selection;
            if (empty) {
              if (d) d(s.tr.addStoredMark(mark));
            } else {
              if (d) {
                const tr = s.tr.removeMark(from, to, auroraSchema.marks.fontFamily).addMark(from, to, mark);
                d(tr);
              }
            }
            return true;
          });
        }
        break;
      }

      case 'setFontSize': {
        const size = payload.size ? String(payload.size) : null;
        if (!size) {
          executed = runPMCommand((s, d) => {
            const { from, to, empty } = s.selection;
            if (empty) {
              if (d) d(s.tr.removeStoredMark(auroraSchema.marks.fontSize));
            } else {
              if (d) d(s.tr.removeMark(from, to, auroraSchema.marks.fontSize));
            }
            return true;
          });
        } else {
          const mark = auroraSchema.marks.fontSize.create({ size });
          executed = runPMCommand((s, d) => {
            const { from, to, empty } = s.selection;
            if (empty) {
              if (d) d(s.tr.addStoredMark(mark));
            } else {
              if (d) {
                const tr = s.tr.removeMark(from, to, auroraSchema.marks.fontSize).addMark(from, to, mark);
                d(tr);
              }
            }
            return true;
          });
        }
        break;
      }

      case 'clearFormatting': {
        executed = runPMCommand((s, d) => {
          let tr = s.tr;

          // 1. Direct NodeSelection on an Image
          if (s.selection instanceof NodeSelection && s.selection.node.type === auroraSchema.nodes.image) {
            if (d) {
              const imgPos = s.selection.from;
              const imgNode = s.selection.node;
              const resetAttrs = {
                src: imgNode.attrs.src,
                alt: imgNode.attrs.alt || '',
                title: imgNode.attrs.title || '',
                width: null,
                height: 'auto',
                aspectRatio: null,
                sizingMode: 'responsive',
                lockAspectRatio: true,
                objectFit: 'cover',
                align: 'center',
                rounded: false,
                shadow: false,
                border: false,
                linkUrl: ''
              };
              tr = tr.setNodeMarkup(imgPos, auroraSchema.nodes.image, resetAttrs);
              d(tr);
            }
            return true;
          }

          // 2. Determine target range for text / blocks / tables / images
          let clearFrom = s.selection.from;
          let clearTo = s.selection.to;

          if (s.selection.empty) {
            const $from = s.selection.$from;

            // Direct check if caret is on an image node
            if ($from.nodeAfter && $from.nodeAfter.type === auroraSchema.nodes.image) {
              if (d) {
                const imgNode = $from.nodeAfter;
                const resetAttrs = {
                  src: imgNode.attrs.src,
                  alt: imgNode.attrs.alt || '',
                  title: imgNode.attrs.title || '',
                  width: null,
                  height: 'auto',
                  aspectRatio: null,
                  sizingMode: 'responsive',
                  lockAspectRatio: true,
                  objectFit: 'cover',
                  align: 'center',
                  rounded: false,
                  shadow: false,
                  border: false,
                  linkUrl: ''
                };
                tr = tr.setNodeMarkup($from.pos, auroraSchema.nodes.image, resetAttrs);
                d(tr);
              }
              return true;
            }

            if ($from.parent.isTextblock) {
              // Check if cursor is directly inside a marked text node (e.g. bold, link, color)
              const nodeStart = $from.start();
              let foundMark = false;
              $from.parent.forEach((child, offset) => {
                const childFrom = nodeStart + offset;
                const childTo = childFrom + child.nodeSize;
                if ($from.pos >= childFrom && $from.pos <= childTo && child.marks.length > 0) {
                  clearFrom = childFrom;
                  clearTo = childTo;
                  foundMark = true;
                }
              });

              // If not inside an isolated mark, expand to the entire parent textblock
              if (!foundMark) {
                clearFrom = $from.start();
                clearTo = $from.end();
              }
            }
          }

          if (d) {
            // A. Remove all inline marks across the target range (bold, italic, color, link, font, etc.)
            if (clearTo > clearFrom) {
              Object.values(auroraSchema.marks).forEach((markType) => {
                tr = tr.removeMark(clearFrom, clearTo, markType);
              });
            }

            // B. Clear stored marks (so immediate typing starts plain)
            tr = tr.setStoredMarks([]);

            // C. Reset block styling, table cell attributes, headings, code blocks, and images
            const scanTo = Math.max(clearFrom + 1, clearTo);
            tr.doc.nodesBetween(clearFrom, scanTo, (node, pos) => {
              // Reset table cells (clear background shading & cell alignment)
              if (node.type === auroraSchema.nodes.table_cell || node.type === auroraSchema.nodes.table_header) {
                if (node.attrs.background || node.attrs.align) {
                  tr = tr.setNodeMarkup(pos, node.type, {
                    ...node.attrs,
                    background: null,
                    align: null
                  });
                }
              }

              // Reset whole table formatting if table root is intersected
              if (node.type === auroraSchema.nodes.table) {
                tr = tr.setNodeMarkup(pos, node.type, {
                  ...node.attrs,
                  striped: false,
                  bordered: true,
                  tableWidth: '100%'
                });
              }

              // Reset image attributes if an image falls within the selection
              if (node.type === auroraSchema.nodes.image) {
                const resetAttrs = {
                  src: node.attrs.src,
                  alt: node.attrs.alt || '',
                  title: node.attrs.title || '',
                  width: null,
                  height: 'auto',
                  aspectRatio: null,
                  sizingMode: 'responsive',
                  lockAspectRatio: true,
                  objectFit: 'cover',
                  align: 'center',
                  rounded: false,
                  shadow: false,
                  border: false,
                  linkUrl: ''
                };
                tr = tr.setNodeMarkup(pos, auroraSchema.nodes.image, resetAttrs);
              }

              // Reset textblocks (convert heading / code_block to paragraph, reset alignment)
              if (node.isTextblock) {
                if (node.type === auroraSchema.nodes.heading || node.type === auroraSchema.nodes.code_block) {
                  tr = tr.setNodeMarkup(pos, auroraSchema.nodes.paragraph, { align: 'left' });
                } else if (node.attrs && node.attrs.align && node.attrs.align !== 'left') {
                  tr = tr.setNodeMarkup(pos, node.type, { ...node.attrs, align: 'left' });
                }
              }
            });

            // D. Lift out of blockquote or callout wrappers
            if (s.selection.$from.depth > 1) {
              for (let depth = s.selection.$from.depth; depth > 0; depth--) {
                const ancestor = s.selection.$from.node(depth);
                if (
                  ancestor.type === auroraSchema.nodes.blockquote ||
                  ancestor.type === auroraSchema.nodes.callout
                ) {
                  try {
                    lift(s, (liftTr) => {
                      tr = liftTr;
                    });
                  } catch {}
                  break;
                }
              }
            }

            d(tr);
          }
          return true;
        });
        break;
      }

      case 'insertCallout': {
        const type = String(payload.type || 'info');
        const p = auroraSchema.nodes.paragraph.create(null, [auroraSchema.text(String(payload.text || 'Important notice or callout'))]);
        const calloutNode = auroraSchema.nodes.callout.create({ type }, [p]);
        const tr = state.tr.replaceSelectionWith(calloutNode);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'insertDetails': {
        const title = String(payload.title || 'Details (click to expand)');
        const summaryNode = auroraSchema.nodes.details_summary.create(null, [auroraSchema.text(title)]);
        const bodyP = auroraSchema.nodes.paragraph.create(null, [auroraSchema.text(String(payload.text || 'Hidden details content goes here...'))]);
        const detailsNode = auroraSchema.nodes.details.create(null, [summaryNode, bodyP]);
        const tr = state.tr.replaceSelectionWith(detailsNode);
        dispatchTransaction(tr, 'command');
        executed = true;
        break;
      }

      case 'deleteSelection':
        executed = runPMCommand(deleteSelection);
        break;

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

    isEditable(): boolean {
      return isEditable;
    },

    setEditable(editable: boolean): void {
      isEditable = editable;
      if (view) {
        view.setProps({ editable: () => isEditable });
      }
      if (options.element) {
        if (isEditable) {
          options.element.removeAttribute('data-readonly');
          options.element.classList.remove('aurora-readonly');
        } else {
          options.element.setAttribute('data-readonly', 'true');
          options.element.classList.add('aurora-readonly');
        }
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
