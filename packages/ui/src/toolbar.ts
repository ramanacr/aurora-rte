import type { AuroraEditor, SelectionState } from '@aurora/editor';
import { t } from './i18n.js';
import { promptLinkDialog, promptImageDialog } from './dialog.js';

export interface DropdownMenuItem {
  id: string;
  labelKey: string;
  command?: string;
  commandArgs?: Record<string, unknown>;
  text: string;
  icon?: string;
  subItems?: DropdownMenuItem[];
}

export interface ToolbarItem {
  id: string;
  labelKey: string;
  command?: string;
  commandArgs?: Record<string, unknown>;
  markName?: string;
  icon?: string;
  text?: string;
  group?: 'style' | 'format' | 'align' | 'list' | 'insert' | 'history' | string;
  isDropdown?: boolean;
  dropdownItems?: DropdownMenuItem[];
}

export interface ToolbarConfig {
  preset?: 'full' | 'standard' | 'minimal';
  items?: ToolbarItem[];
  hiddenItems?: string[];
  customItems?: ToolbarItem[];
  onAction?: (actionId: string) => void;
}

export const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#d9d9d9', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#ec4899', '#28E6F5', '#14b8a6', '#84cc16'
];

export const HIGHLIGHT_PALETTE = [
  '#fef08a', '#bbf7d0', '#fed7aa', '#fbcfe8', '#ddd6fe', '#bae6fd',
  '#fef9c3', '#dcfce7', '#ffedd5', '#fce7f3', '#f3e8ff', '#e0f2fe'
];

export interface FontFamilyOption {
  id: string;
  label: string;
  family: string;
  group: 'system' | 'web';
  googleFont?: string;
}

export const FONT_FAMILIES: FontFamilyOption[] = [
  // System Fonts
  { id: 'font-inter', label: 'Inter (Modern Sans)', family: 'Inter, system-ui, -apple-system, sans-serif', group: 'system' },
  { id: 'font-arial', label: 'Arial (Standard)', family: 'Arial, Helvetica, sans-serif', group: 'system' },
  { id: 'font-serif', label: 'Georgia (Editorial)', family: 'Georgia, Cambria, "Times New Roman", serif', group: 'system' },
  { id: 'font-mono', label: 'Monospace (Code)', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', group: 'system' },

  // Web Fonts (Google Fonts)
  { id: 'font-roboto', label: 'Roboto', family: '"Roboto", sans-serif', group: 'web', googleFont: 'Roboto:ital,wght@0,300;0,400;0,700;1,400' },
  { id: 'font-poppins', label: 'Poppins', family: '"Poppins", sans-serif', group: 'web', googleFont: 'Poppins:wght@300;400;600;700' },
  { id: 'font-montserrat', label: 'Montserrat', family: '"Montserrat", sans-serif', group: 'web', googleFont: 'Montserrat:wght@400;600;700' },
  { id: 'font-opensans', label: 'Open Sans', family: '"Open Sans", sans-serif', group: 'web', googleFont: 'Open+Sans:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'font-lato', label: 'Lato', family: '"Lato", sans-serif', group: 'web', googleFont: 'Lato:wght@300;400;700' },
  { id: 'font-playfair', label: 'Playfair Display', family: '"Playfair Display", serif', group: 'web', googleFont: 'Playfair+Display:ital,wght@0,400;0,700;1,400' },
  { id: 'font-merriweather', label: 'Merriweather', family: '"Merriweather", serif', group: 'web', googleFont: 'Merriweather:ital,wght@0,400;0,700;1,400' },
  { id: 'font-lora', label: 'Lora', family: '"Lora", serif', group: 'web', googleFont: 'Lora:ital,wght@0,400;0,600;1,400' },
  { id: 'font-oswald', label: 'Oswald', family: '"Oswald", sans-serif', group: 'web', googleFont: 'Oswald:wght@400;600;700' },
  { id: 'font-dancing', label: 'Dancing Script', family: '"Dancing Script", cursive', group: 'web', googleFont: 'Dancing+Script:wght@400;700' },
  { id: 'font-caveat', label: 'Caveat', family: '"Caveat", cursive', group: 'web', googleFont: 'Caveat:wght@400;700' },
  { id: 'font-jetbrains', label: 'JetBrains Mono', family: '"JetBrains Mono", monospace', group: 'web', googleFont: 'JetBrains+Mono:wght@400;600;700' }
];

const loadedGoogleFonts = new Set<string>();

export function loadGoogleFont(fontQuery: string): void {
  if (typeof document === 'undefined' || !fontQuery || loadedGoogleFonts.has(fontQuery)) return;
  loadedGoogleFonts.add(fontQuery);

  const linkId = `google-font-${fontQuery.replace(/[^a-zA-Z0-9]/g, '-')}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  document.head.appendChild(link);
}

export const FONT_SIZES = [
  { id: 'fs-12', label: '12px Small', size: '12px' },
  { id: 'fs-14', label: '14px Body Small', size: '14px' },
  { id: 'fs-16', label: '16px Normal', size: '16px' },
  { id: 'fs-18', label: '18px Medium', size: '18px' },
  { id: 'fs-24', label: '24px Large', size: '24px' },
  { id: 'fs-32', label: '32px Huge', size: '32px' }
];

export const FULL_TOOLBAR_ITEMS: ToolbarItem[] = [
  // 1. History Group
  { id: 'undo', labelKey: 'toolbar.undo', command: 'undo', text: '↩', group: 'history' },
  { id: 'redo', labelKey: 'toolbar.redo', command: 'redo', text: '↪', group: 'history' },

  // 2. Style / Typography Dropdown
  {
    id: 'style',
    labelKey: 'toolbar.style',
    text: 'Normal text',
    group: 'style',
    isDropdown: true,
    dropdownItems: [
      { id: 'paragraph', labelKey: 'toolbar.paragraph', command: 'setParagraph', text: 'Normal text' },
      { id: 'h1', labelKey: 'toolbar.h1', command: 'setHeading', commandArgs: { level: 1 }, text: 'Heading 1' },
      { id: 'h2', labelKey: 'toolbar.h2', command: 'setHeading', commandArgs: { level: 2 }, text: 'Heading 2' },
      { id: 'h3', labelKey: 'toolbar.h3', command: 'setHeading', commandArgs: { level: 3 }, text: 'Heading 3' },
      { id: 'h4', labelKey: 'toolbar.h4', command: 'setHeading', commandArgs: { level: 4 }, text: 'Heading 4' },
      { id: 'h5', labelKey: 'toolbar.h5', command: 'setHeading', commandArgs: { level: 5 }, text: 'Heading 5' },
      { id: 'h6', labelKey: 'toolbar.h6', command: 'setHeading', commandArgs: { level: 6 }, text: 'Heading 6' },
      { id: 'blockquote', labelKey: 'toolbar.blockquote', command: 'toggleBlockquote', text: '“ Quote' }
    ]
  },

  // 3. Font Family Dropdown
  {
    id: 'fontFamily',
    labelKey: 'toolbar.fontFamily',
    text: 'Font',
    group: 'typography',
    isDropdown: true,
    dropdownItems: FONT_FAMILIES.map(f => ({
      id: f.id,
      labelKey: f.id,
      command: 'setFontFamily',
      commandArgs: { family: f.family },
      text: f.label
    }))
  },

  // 4. Font Size Dropdown
  {
    id: 'fontSize',
    labelKey: 'toolbar.fontSize',
    text: 'Size',
    group: 'typography',
    isDropdown: true,
    dropdownItems: FONT_SIZES.map(s => ({
      id: s.id,
      labelKey: s.id,
      command: 'setFontSize',
      commandArgs: { size: s.size },
      text: s.label
    }))
  },

  // 5. Formatting Group
  { id: 'bold', labelKey: 'toolbar.bold', command: 'toggleBold', markName: 'bold', text: 'B', group: 'format' },
  { id: 'italic', labelKey: 'toolbar.italic', command: 'toggleItalic', markName: 'italic', text: 'I', group: 'format' },
  { id: 'underline', labelKey: 'toolbar.underline', command: 'toggleUnderline', markName: 'underline', text: 'U', group: 'format' },
  { id: 'strike', labelKey: 'toolbar.strike', command: 'toggleStrike', markName: 'strike', text: 'S', group: 'format' },
  { id: 'code', labelKey: 'toolbar.code', command: 'toggleCode', markName: 'code', text: '<>', group: 'format' },
  { id: 'subscript', labelKey: 'toolbar.subscript', command: 'toggleSubscript', markName: 'subscript', text: 'X₂', group: 'format' },
  { id: 'superscript', labelKey: 'toolbar.superscript', command: 'toggleSuperscript', markName: 'superscript', text: 'X²', group: 'format' },

  // 6. Color Pickers Dropdowns
  {
    id: 'textColor',
    labelKey: 'toolbar.textColor',
    text: '🎨 Color',
    group: 'color',
    isDropdown: true,
    dropdownItems: [
      { id: 'color-default', labelKey: 'toolbar.textColor', command: 'setTextColor', commandArgs: { color: null }, text: '↺ Reset Color' },
      ...COLOR_PALETTE.map((hex) => ({
        id: `color-${hex.replace('#', '')}`,
        labelKey: 'toolbar.textColor',
        command: 'setTextColor',
        commandArgs: { color: hex },
        text: `■ Color ${hex}`
      }))
    ]
  },
  {
    id: 'textHighlight',
    labelKey: 'toolbar.textHighlight',
    text: '🖍️ Highlight',
    group: 'color',
    isDropdown: true,
    dropdownItems: [
      { id: 'highlight-default', labelKey: 'toolbar.textHighlight', command: 'setTextHighlight', commandArgs: { color: null }, text: '↺ Remove Highlight' },
      ...HIGHLIGHT_PALETTE.map((hex) => ({
        id: `hl-${hex.replace('#', '')}`,
        labelKey: 'toolbar.textHighlight',
        command: 'setTextHighlight',
        commandArgs: { color: hex },
        text: `■ Highlight ${hex}`
      }))
    ]
  },
  { id: 'clearFormatting', labelKey: 'toolbar.clearFormatting', command: 'clearFormatting', text: '🧹 Clear', group: 'color' },

  // 7. Alignment Dropdown
  {
    id: 'align',
    labelKey: 'toolbar.align',
    text: '⫷ Left',
    group: 'align',
    isDropdown: true,
    dropdownItems: [
      { id: 'alignLeft', labelKey: 'toolbar.alignLeft', command: 'alignLeft', text: '⫷ Align Left' },
      { id: 'alignCenter', labelKey: 'toolbar.alignCenter', command: 'alignCenter', text: '☰ Align Center' },
      { id: 'alignRight', labelKey: 'toolbar.alignRight', command: 'alignRight', text: '⫸ Align Right' },
      { id: 'alignJustify', labelKey: 'toolbar.alignJustify', command: 'alignJustify', text: '☷ Justify' }
    ]
  },

  // 8. Lists Group
  { id: 'bulletList', labelKey: 'toolbar.bulletList', command: 'toggleBulletList', text: '• List', group: 'list' },
  { id: 'orderedList', labelKey: 'toolbar.orderedList', command: 'toggleOrderedList', text: '1. List', group: 'list' },

  // 9. Insert Dropdown (Rich Nodes)
  {
    id: 'insert',
    labelKey: 'toolbar.insert',
    text: '＋ Insert',
    group: 'insert',
    isDropdown: true,
    dropdownItems: [
      { id: 'link', labelKey: 'toolbar.link', command: 'setLink', text: '🔗 Link' },
      { id: 'image', labelKey: 'toolbar.image', command: 'insertImage', text: '🖼️ Image' },
      { id: 'table', labelKey: 'toolbar.table', command: 'insertTable', commandArgs: { rows: 3, cols: 3, header: true }, text: '⊞ Table (3×3)' },
      { id: 'callout', labelKey: 'toolbar.callout', command: 'insertCallout', commandArgs: { type: 'info', text: 'Important information' }, text: '💡 Callout Box' },
      { id: 'details', labelKey: 'toolbar.details', command: 'insertDetails', commandArgs: { title: 'Click to expand', text: 'Hidden content details' }, text: '▶ Details / Accordion' },
      { id: 'horizontalRule', labelKey: 'toolbar.horizontalRule', command: 'insertHorizontalRule', text: '― Divider' }
    ]
  },

  // 10. Table Operations Dropdown with Cascading Groups (MS Word style)
  {
    id: 'tableMenu',
    labelKey: 'toolbar.tableMenu',
    text: '⊞ Table Tools',
    group: 'table',
    isDropdown: true,
    dropdownItems: [
      {
        id: 'tableStructure',
        labelKey: 'toolbar.tableStructure',
        text: 'Rows & Columns',
        subItems: [
          { id: 'addRowAbove', labelKey: 'toolbar.addRowAbove', command: 'addTableRowAbove', text: '⬆ Add Row Above' },
          { id: 'addRowBelow', labelKey: 'toolbar.addRowBelow', command: 'addTableRowBelow', text: '⬇ Add Row Below' },
          { id: 'deleteRow', labelKey: 'toolbar.deleteRow', command: 'deleteTableRow', text: '✕ Delete Current Row' },
          { id: 'addColBefore', labelKey: 'toolbar.addColBefore', command: 'addTableColBefore', text: '⬅ Add Column Before' },
          { id: 'addColAfter', labelKey: 'toolbar.addColAfter', command: 'addTableColAfter', text: '➡ Add Column After' },
          { id: 'deleteCol', labelKey: 'toolbar.deleteCol', command: 'deleteTableCol', text: '✕ Delete Current Column' }
        ]
      },
      {
        id: 'tableDesign',
        labelKey: 'toolbar.tableDesign',
        text: 'Design & Width',
        subItems: [
          { id: 'tableWidth100', labelKey: 'toolbar.tableWidth100', command: 'updateTable', commandArgs: { tableWidth: '100%' }, text: '↔ 100% Full Width' },
          { id: 'tableWidthAuto', labelKey: 'toolbar.tableWidthAuto', command: 'updateTable', commandArgs: { tableWidth: 'auto' }, text: '⇥ Fit Content Width' },
          { id: 'tableStriped', labelKey: 'toolbar.tableStriped', command: 'updateTable', commandArgs: { striped: true }, text: '🦓 Zebra Striped Rows' },
          { id: 'tablePlain', labelKey: 'toolbar.tablePlain', command: 'updateTable', commandArgs: { striped: false }, text: '◻ Plain White Rows' },
          { id: 'tableBorders', labelKey: 'toolbar.tableBorders', command: 'updateTable', commandArgs: { bordered: true }, text: '▦ Crisp Gridlines' }
        ]
      },
      {
        id: 'cellShading',
        labelKey: 'toolbar.cellShading',
        text: 'Cell Shading',
        subItems: [
          { id: 'shade-blue', labelKey: 'toolbar.shadeBlue', command: 'updateTableCell', commandArgs: { background: 'rgba(40, 230, 245, 0.15)' }, text: '■ Cyan / Blue Tint' },
          { id: 'shade-green', labelKey: 'toolbar.shadeGreen', command: 'updateTableCell', commandArgs: { background: 'rgba(37, 224, 196, 0.15)' }, text: '■ Emerald Tint' },
          { id: 'shade-purple', labelKey: 'toolbar.shadePurple', command: 'updateTableCell', commandArgs: { background: 'rgba(117, 73, 255, 0.18)' }, text: '■ Indigo / Purple Tint' },
          { id: 'shade-amber', labelKey: 'toolbar.shadeAmber', command: 'updateTableCell', commandArgs: { background: 'rgba(255, 171, 0, 0.15)' }, text: '■ Warm Amber Tint' },
          { id: 'shade-clear', labelKey: 'toolbar.shadeClear', command: 'updateTableCell', commandArgs: { background: null }, text: '↺ Clear Cell Shading' }
        ]
      },
      { id: 'deleteTable', labelKey: 'toolbar.deleteTable', command: 'deleteTable', text: '🗑️ Delete Entire Table' }
    ]
  }
];

export const STANDARD_TOOLBAR_ITEMS: ToolbarItem[] = FULL_TOOLBAR_ITEMS.filter(item =>
  ['bold', 'italic', 'underline', 'strike', 'code', 'style', 'textColor', 'align', 'bulletList', 'orderedList', 'insert', 'undo', 'redo'].includes(item.id)
);

export const MINIMAL_TOOLBAR_ITEMS: ToolbarItem[] = FULL_TOOLBAR_ITEMS.filter(item =>
  ['bold', 'italic', 'link', 'bulletList', 'undo', 'redo'].includes(item.id)
);

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = FULL_TOOLBAR_ITEMS;

export interface ToolbarOptions {
  editor: AuroraEditor;
  container: HTMLElement;
  items?: ToolbarItem[];
  config?: ToolbarConfig;
}

export interface ToolbarInstance {
  element: HTMLElement;
  destroy(): void;
}

const TOOLBAR_STYLES = `
  .aurora-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: var(--aurora-muted-bg, #24292c);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: var(--aurora-radius, 8px);
    box-sizing: border-box;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.04);
    max-width: 100%;
    min-width: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(183, 255, 60, 0.3) transparent;
  }

  .aurora-toolbar::-webkit-scrollbar {
    height: 4px;
  }
  .aurora-toolbar::-webkit-scrollbar-thumb {
    background: rgba(183, 255, 60, 0.3);
    border-radius: 4px;
  }

  .aurora-toolbar-group {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: rgba(255, 255, 255, 0.03);
    padding: 3px 4px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .aurora-toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    padding: 5px 9px;
    margin: 0;
    font-family: var(--aurora-font-family, system-ui, -apple-system, BlinkMacSystemFont, sans-serif);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    color: var(--aurora-fg, #f1f4ef);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    user-select: none;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .aurora-toolbar-btn:hover {
    background: var(--aurora-btn-hover, #303639);
    border-color: rgba(183, 255, 60, 0.35);
    color: var(--aurora-primary, #b7ff3c);
  }

  .aurora-toolbar-btn:active {
    transform: scale(0.96);
  }

  .aurora-toolbar-btn.is-active,
  .aurora-toolbar-btn[aria-pressed="true"] {
    background: var(--aurora-primary, #b7ff3c);
    border-color: var(--aurora-primary, #b7ff3c);
    color: var(--aurora-primary-fg, #172000);
    font-weight: 700;
    box-shadow: 0 0 14px rgba(183, 255, 60, 0.45);
  }

  .aurora-toolbar-btn:focus-visible {
    outline: none;
    border-color: var(--aurora-focus-ring, #b7ff3c);
    box-shadow: 0 0 0 2px var(--aurora-focus-ring, #b7ff3c);
  }

  /* Dropdown Menus */
  .aurora-dropdown-container {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
  }

  .aurora-dropdown-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
  }

  .aurora-dropdown-btn .aurora-caret {
    font-size: 10px;
    opacity: 0.75;
    transition: transform 0.15s ease;
    margin-left: 2px;
  }

  .aurora-dropdown-btn[aria-expanded="true"] .aurora-caret {
    transform: rotate(180deg);
  }

  .aurora-dropdown-menu {
    position: fixed;
    z-index: 100000;
    min-width: 175px;
    background: var(--aurora-bg, #171a1c);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    padding: 6px;
    display: none;
    flex-direction: column;
    gap: 2px;
    box-sizing: border-box;
  }

  .aurora-dropdown-menu.is-open {
    display: flex;
  }

  /* Cascading Sub-menu Styles (MS Word style) */
  .aurora-cascade-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 7px 12px;
    text-align: left;
    font-family: var(--aurora-font-family, system-ui, sans-serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--aurora-fg, #f1f4ef);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-sizing: border-box;
    white-space: nowrap;
  }

  .aurora-cascade-item:hover,
  .aurora-cascade-item:focus {
    background: rgba(183, 255, 60, 0.14);
    color: var(--aurora-primary, #b7ff3c);
    outline: none;
  }

  .aurora-cascade-item .aurora-cascade-arrow {
    font-size: 10px;
    opacity: 0.7;
    margin-left: 8px;
  }

  .aurora-cascade-submenu {
    position: absolute;
    top: -6px;
    left: 100%;
    z-index: 1001;
    min-width: 175px;
    background: var(--aurora-bg, #171a1c);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    padding: 6px;
    display: none;
    flex-direction: column;
    gap: 2px;
    box-sizing: border-box;
  }

  .aurora-cascade-item:hover > .aurora-cascade-submenu,
  .aurora-cascade-item.is-open > .aurora-cascade-submenu {
    display: flex;
  }

  .aurora-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 12px;
    text-align: left;
    font-family: var(--aurora-font-family, system-ui, sans-serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--aurora-fg, #f1f4ef);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-sizing: border-box;
    white-space: nowrap;
  }

  .aurora-dropdown-item:hover,
  .aurora-dropdown-item:focus {
    background: rgba(183, 255, 60, 0.14);
    color: var(--aurora-primary, #b7ff3c);
    outline: none;
  }

  .aurora-dropdown-item.is-active {
    background: rgba(183, 255, 60, 0.22);
    color: var(--aurora-primary, #b7ff3c);
    font-weight: 700;
  }

  /* Font Search Box & Group Headers */
  .aurora-font-search-container {
    padding: 6px 8px 8px 8px;
    border-bottom: 1px solid var(--aurora-border, #485054);
    margin-bottom: 4px;
    box-sizing: border-box;
  }

  .aurora-font-search-input {
    width: 100%;
    padding: 6px 10px;
    font-family: var(--aurora-font-family, system-ui, sans-serif);
    font-size: 12px;
    border-radius: 6px;
    border: 1px solid var(--aurora-border, #485054);
    background: var(--aurora-muted-bg, rgba(255, 255, 255, 0.06));
    color: var(--aurora-fg, #f1f4ef);
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .aurora-font-search-input:focus {
    border-color: var(--aurora-primary, #b7ff3c);
    box-shadow: 0 0 6px rgba(183, 255, 60, 0.35);
  }

  .aurora-font-group-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--aurora-primary, #b7ff3c);
    padding: 6px 10px 4px 10px;
    margin-top: 4px;
    opacity: 0.85;
    user-select: none;
  }

  .aurora-font-list-scroll {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* Color Swatch Picker Grid */
  .aurora-swatch-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    padding: 6px 4px;
    box-sizing: border-box;
  }

  .aurora-swatch-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s ease, border-color 0.1s ease;
    box-sizing: border-box;
  }

  .aurora-swatch-btn:hover {
    transform: scale(1.15);
    border-color: #fff;
    z-index: 2;
  }

  .aurora-swatch-clear {
    grid-column: span 6;
    margin-top: 4px;
    padding: 6px 8px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    background: rgba(255, 255, 255, 0.08);
    color: var(--aurora-fg, #f1f4ef);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 4px;
    cursor: pointer;
  }

  .aurora-swatch-clear:hover {
    background: rgba(255, 101, 119, 0.2);
    color: #ff6577;
  }

  /* Editor & ProseMirror Content Styles */
  .ProseMirror {
    outline: none;
    min-height: 200px;
    font-family: var(--aurora-font-family, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    font-size: var(--aurora-font-size, 15px);
    line-height: 1.6;
    color: var(--aurora-fg, #f1f4ef);
    word-break: break-word;
  }

  .ProseMirror p {
    margin: 0 0 0.85em 0;
  }

  /* Callout / Alert styling */
  .ProseMirror .aurora-callout {
    margin: 14px 0;
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 5px solid var(--aurora-primary, #b7ff3c);
    background: rgba(183, 255, 60, 0.08);
    color: var(--aurora-fg, #f1f4ef);
  }

  .ProseMirror .aurora-callout-warning {
    border-left-color: #ffc857;
    background: rgba(255, 200, 87, 0.08);
  }

  .ProseMirror .aurora-callout-error {
    border-left-color: #ff6577;
    background: rgba(255, 101, 119, 0.08);
  }

  .ProseMirror .aurora-callout-success {
    border-left-color: #68e875;
    background: rgba(104, 232, 117, 0.08);
  }

  .ProseMirror .aurora-callout p {
    margin: 0;
  }

  /* Details / Summary Accordion */
  .ProseMirror details.aurora-details {
    margin: 14px 0;
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    overflow: hidden;
  }

  .ProseMirror details.aurora-details > summary.aurora-summary {
    padding: 10px 14px;
    cursor: pointer;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.05);
    color: var(--aurora-primary, #b7ff3c);
    user-select: none;
    outline: none;
  }

  .ProseMirror details.aurora-details > p,
  .ProseMirror details.aurora-details > div {
    padding: 10px 14px;
    margin: 0;
  }

  /* Table styling - visible, crisp borders, distinct header, interactive cells */
  .ProseMirror table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    table-layout: fixed;
    overflow: hidden;
    border: 2px solid var(--aurora-border, #485054);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
  }

  .ProseMirror table[data-table-width="auto"],
  .ProseMirror table.aurora-table-auto-width {
    width: auto !important;
    max-width: 100%;
    table-layout: auto !important;
  }

  .ProseMirror table[data-table-width="100%"] {
    width: 100% !important;
    table-layout: fixed;
  }

  /* Table borders */
  .ProseMirror table.aurora-table-bordered,
  .ProseMirror table[data-bordered="true"] {
    border: 2px solid var(--aurora-border, #485054);
  }
  .ProseMirror table.aurora-table-bordered th,
  .ProseMirror table.aurora-table-bordered td,
  .ProseMirror table[data-bordered="true"] th,
  .ProseMirror table[data-bordered="true"] td {
    border: 1px solid var(--aurora-border, #485054);
  }

  /* Borderless / Hidden borders */
  .ProseMirror table[data-bordered="false"],
  .ProseMirror table:not(.aurora-table-bordered):not([data-bordered="true"]) {
    border: 1px dashed rgba(255, 255, 255, 0.15) !important;
  }
  .ProseMirror table[data-bordered="false"] th,
  .ProseMirror table[data-bordered="false"] td,
  .ProseMirror table:not(.aurora-table-bordered):not([data-bordered="true"]) th,
  .ProseMirror table:not(.aurora-table-bordered):not([data-bordered="true"]) td {
    border: 1px dashed rgba(255, 255, 255, 0.08) !important;
  }
  [data-theme="light"] .ProseMirror table[data-bordered="false"],
  [data-theme="light"] .ProseMirror table:not(.aurora-table-bordered):not([data-bordered="true"]) {
    border: 1px dashed rgba(0, 0, 0, 0.15) !important;
  }
  [data-theme="light"] .ProseMirror table[data-bordered="false"] th,
  [data-theme="light"] .ProseMirror table[data-bordered="false"] td,
  [data-theme="light"] .ProseMirror table:not(.aurora-table-bordered):not([data-bordered="true"]) th,
  [data-theme="light"] .ProseMirror table:not(.aurora-table-bordered):not([data-bordered="true"]) td {
    border: 1px dashed rgba(0, 0, 0, 0.08) !important;
  }

  /* Zebra Striping */
  .ProseMirror table.aurora-table-striped tbody tr:nth-child(even) td:not([data-background]),
  .ProseMirror table[data-striped="true"] tbody tr:nth-child(even) td:not([data-background]) {
    background: rgba(255, 255, 255, 0.055);
  }

  .ProseMirror table.aurora-table-striped tbody tr:nth-child(odd) td:not([data-background]),
  .ProseMirror table[data-striped="true"] tbody tr:nth-child(odd) td:not([data-background]) {
    background: rgba(255, 255, 255, 0.015);
  }

  [data-theme="light"] .ProseMirror table.aurora-table-striped tbody tr:nth-child(even) td:not([data-background]),
  [data-theme="light"] .ProseMirror table[data-striped="true"] tbody tr:nth-child(even) td:not([data-background]) {
    background: rgba(0, 0, 0, 0.04);
  }

  [data-theme="light"] .ProseMirror table.aurora-table-striped tbody tr:nth-child(odd) td:not([data-background]),
  [data-theme="light"] .ProseMirror table[data-striped="true"] tbody tr:nth-child(odd) td:not([data-background]) {
    background: transparent;
  }

  .ProseMirror th,
  .ProseMirror td {
    border: 1px solid var(--aurora-border, #485054);
    padding: 10px 14px;
    min-width: 80px;
    min-height: 42px;
    vertical-align: top;
    box-sizing: border-box;
    position: relative;
    transition: background-color 0.15s ease;
  }

  .ProseMirror th {
    background: rgba(183, 255, 60, 0.12);
    font-weight: 700;
    color: var(--aurora-primary, #b7ff3c);
    text-align: left;
    border-bottom: 2px solid var(--aurora-border, #485054);
  }

  .ProseMirror td {
    background: rgba(255, 255, 255, 0.02);
  }

  .ProseMirror td:hover,
  .ProseMirror th:hover {
    background: rgba(183, 255, 60, 0.06);
  }

  .ProseMirror th > p,
  .ProseMirror td > p {
    margin: 0;
    min-height: 1.3em;
  }

  .ProseMirror blockquote {
    margin: 1em 0;
    padding: 8px 16px;
    border-left: 4px solid var(--aurora-primary, #b7ff3c);
    background: rgba(183, 255, 60, 0.06);
    border-radius: 0 6px 6px 0;
    color: var(--aurora-muted-fg, #aab2b0);
  }

  .ProseMirror pre {
    background: #121416;
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 6px;
    padding: 12px 16px;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
    overflow-x: auto;
  }

  .ProseMirror ul, .ProseMirror ol {
    padding-left: 24px;
    margin: 0.5em 0 1em 0;
  }

  .ProseMirror hr {
    border: none;
    border-top: 2px solid var(--aurora-border, #485054);
    margin: 1.5em 0;
  }

  .ProseMirror a {
    color: var(--aurora-primary, #b7ff3c);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .ProseMirror a:hover {
    filter: brightness(1.15);
  }

  .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 12px 0;
    display: inline-block;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.1));
  }
`;

function ensureToolbarStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('aurora-toolbar-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'aurora-toolbar-styles';
  styleEl.textContent = TOOLBAR_STYLES;
  document.head.appendChild(styleEl);
}

export function createToolbar(options: ToolbarOptions): ToolbarInstance {
  ensureToolbarStyles();

  const { editor, container, config } = options;
  let items: ToolbarItem[] = [];

  if (options.items) {
    items = [...options.items];
  } else if (config) {
    if (config.items) {
      items = [...config.items];
    } else if (config.preset === 'minimal') {
      items = [...MINIMAL_TOOLBAR_ITEMS];
    } else if (config.preset === 'standard') {
      items = [...STANDARD_TOOLBAR_ITEMS];
    } else {
      items = [...FULL_TOOLBAR_ITEMS];
    }

    if (config.customItems) {
      items.push(...config.customItems);
    }

    if (config.hiddenItems && config.hiddenItems.length > 0) {
      items = items.filter((item) => !config.hiddenItems!.includes(item.id));
    }
  } else {
    items = [...DEFAULT_TOOLBAR_ITEMS];
  }

  const toolbarEl = document.createElement('div');
  toolbarEl.setAttribute('role', 'toolbar');
  toolbarEl.setAttribute('aria-label', 'Editor formatting toolbar');
  toolbarEl.className = 'aurora-toolbar';

  const buttons: HTMLButtonElement[] = [];
  const portaledMenus: { menu: HTMLDivElement; btn: HTMLButtonElement; position: () => void }[] = [];

  // Group items by their group property (or single items)
  let currentGroupEl: HTMLDivElement | null = null;
  let currentGroupName: string | null = null;

  items.forEach((item, index) => {
    const itemGroup = item.group || 'default';

    if (!currentGroupEl || currentGroupName !== itemGroup) {
      currentGroupEl = document.createElement('div');
      currentGroupEl.className = `aurora-toolbar-group aurora-group-${itemGroup}`;
      currentGroupEl.setAttribute('role', 'group');
      currentGroupEl.setAttribute('aria-label', `${itemGroup} controls`);
      toolbarEl.appendChild(currentGroupEl);
      currentGroupName = itemGroup;
    }

    if (item.isDropdown && item.dropdownItems && item.dropdownItems.length > 0) {
      const dropdownContainer = document.createElement('div');
      dropdownContainer.className = `aurora-dropdown-container aurora-dropdown-${item.id}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', t(item.labelKey, item.id));
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.className = `aurora-toolbar-btn aurora-dropdown-btn aurora-btn-${item.id}`;
      btn.tabIndex = index === 0 ? 0 : -1;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'aurora-dropdown-label';
      labelSpan.textContent = item.text || item.id;
      const caretSpan = document.createElement('span');
      caretSpan.className = 'aurora-caret';
      caretSpan.textContent = '▾';
      btn.appendChild(labelSpan);
      btn.appendChild(caretSpan);

      const menu = document.createElement('div');
      menu.className = `aurora-dropdown-menu aurora-dropdown-menu-${item.id}`;
      menu.setAttribute('role', 'menu');

      if (item.id === 'textColor' || item.id === 'textHighlight') {
        const palette = item.id === 'textColor' ? COLOR_PALETTE : HIGHLIGHT_PALETTE;
        const grid = document.createElement('div');
        grid.className = 'aurora-swatch-grid';
        grid.setAttribute('role', 'group');
        grid.setAttribute('aria-label', `${item.text} colors`);

        palette.forEach((hex) => {
          const swatchBtn = document.createElement('button');
          swatchBtn.type = 'button';
          swatchBtn.className = 'aurora-swatch-btn';
          swatchBtn.style.backgroundColor = hex;
          swatchBtn.title = hex;
          swatchBtn.setAttribute('aria-label', `Color ${hex}`);
          swatchBtn.tabIndex = -1;

          swatchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu(false);
            const cmd = item.id === 'textColor' ? 'setTextColor' : 'setTextHighlight';
            editor.execute(cmd, { color: hex });
            config?.onAction?.(`${cmd}:${hex}`);
            editor.focus();
          });
          grid.appendChild(swatchBtn);
        });

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'aurora-swatch-clear';
        clearBtn.textContent = item.id === 'textColor' ? '↺ Reset Color' : '↺ Remove Highlight';
        clearBtn.tabIndex = -1;
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMenu(false);
          const cmd = item.id === 'textColor' ? 'setTextColor' : 'setTextHighlight';
          editor.execute(cmd, { color: null });
          config?.onAction?.(`${cmd}:clear`);
          editor.focus();
        });
        grid.appendChild(clearBtn);
        menu.appendChild(grid);
      } else if (item.id === 'fontFamily') {
        // Searchable, grouped Font Family dropdown
        const searchContainer = document.createElement('div');
        searchContainer.className = 'aurora-font-search-container';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Search fonts...';
        searchInput.className = 'aurora-font-search-input';
        searchInput.tabIndex = -1;
        searchContainer.appendChild(searchInput);
        menu.appendChild(searchContainer);

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'aurora-font-list-scroll';

        const systemHeader = document.createElement('div');
        systemHeader.className = 'aurora-font-group-header';
        systemHeader.textContent = 'System Fonts';

        const webHeader = document.createElement('div');
        webHeader.className = 'aurora-font-group-header';
        webHeader.textContent = 'Web Fonts';

        const fontButtons: { option: FontFamilyOption; btn: HTMLButtonElement }[] = [];

        FONT_FAMILIES.forEach((f) => {
          const subBtn = document.createElement('button');
          subBtn.type = 'button';
          subBtn.className = `aurora-dropdown-item aurora-sub-${f.id}`;
          subBtn.setAttribute('role', 'menuitem');
          subBtn.textContent = f.label;
          subBtn.tabIndex = -1;
          subBtn.style.fontFamily = f.family;

          if (f.googleFont) {
            subBtn.addEventListener('mouseenter', () => {
              loadGoogleFont(f.googleFont!);
            });
          }

          subBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu(false);

            if (f.googleFont) {
              loadGoogleFont(f.googleFont);
            }
            const fontLabel = toolbarEl.querySelector('.aurora-btn-fontFamily .aurora-dropdown-label');
            if (fontLabel) {
              fontLabel.textContent = f.label.split(' ')[0];
            }

            editor.execute('setFontFamily', { family: f.family });
            config?.onAction?.(`setFontFamily:${f.id}`);
            editor.focus();
          });

          fontButtons.push({ option: f, btn: subBtn });
        });

        function renderFontList(query = '') {
          scrollContainer.innerHTML = '';
          const q = query.toLowerCase().trim();

          const matchedSystem = fontButtons.filter(
            (item) => item.option.group === 'system' && (!q || item.option.label.toLowerCase().includes(q) || item.option.family.toLowerCase().includes(q))
          );
          const matchedWeb = fontButtons.filter(
            (item) => item.option.group === 'web' && (!q || item.option.label.toLowerCase().includes(q) || item.option.family.toLowerCase().includes(q))
          );

          if (matchedSystem.length > 0) {
            scrollContainer.appendChild(systemHeader);
            matchedSystem.forEach((item) => scrollContainer.appendChild(item.btn));
          }

          if (matchedWeb.length > 0) {
            scrollContainer.appendChild(webHeader);
            matchedWeb.forEach((item) => scrollContainer.appendChild(item.btn));
          }

          if (matchedSystem.length === 0 && matchedWeb.length === 0) {
            const noMatch = document.createElement('div');
            noMatch.style.cssText = 'padding: 10px; font-size: 12px; color: var(--aurora-muted-fg); text-align: center;';
            noMatch.textContent = 'No matching fonts';
            scrollContainer.appendChild(noMatch);
          }
        }

        searchInput.addEventListener('input', () => {
          renderFontList(searchInput.value);
        });

        searchInput.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        searchInput.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Escape') {
            e.preventDefault();
            toggleMenu(false);
            btn.focus();
          }
        });

        renderFontList();
        menu.appendChild(scrollContainer);
      } else {
        item.dropdownItems.forEach((subItem) => {
          if (subItem.subItems && subItem.subItems.length > 0) {
            // Cascading sub-menu item
            const cascadeContainer = document.createElement('div');
            cascadeContainer.className = `aurora-cascade-item aurora-cascade-${subItem.id}`;
            cascadeContainer.setAttribute('role', 'menuitem');
            cascadeContainer.setAttribute('aria-haspopup', 'true');
            cascadeContainer.setAttribute('aria-expanded', 'false');

            const textSpan = document.createElement('span');
            textSpan.textContent = subItem.text;
            const arrowSpan = document.createElement('span');
            arrowSpan.className = 'aurora-cascade-arrow';
            arrowSpan.textContent = '▶';

            cascadeContainer.appendChild(textSpan);
            cascadeContainer.appendChild(arrowSpan);

            const subMenu = document.createElement('div');
            subMenu.className = 'aurora-cascade-submenu';
            subMenu.setAttribute('role', 'menu');

            subItem.subItems.forEach((leaf) => {
              const leafBtn = document.createElement('button');
              leafBtn.type = 'button';
              leafBtn.className = `aurora-dropdown-item aurora-sub-${leaf.id}`;
              leafBtn.setAttribute('role', 'menuitem');
              leafBtn.textContent = leaf.text;
              leafBtn.tabIndex = -1;

              leafBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu(false);
                if (leaf.id === 'link') {
                  promptLinkDialog(editor);
                } else if (leaf.id === 'image') {
                  promptImageDialog(editor);
                } else if (leaf.command) {
                  editor.execute(leaf.command, leaf.commandArgs);
                  config?.onAction?.(leaf.command);
                  editor.focus();
                }
              });

              subMenu.appendChild(leafBtn);
            });

            cascadeContainer.appendChild(subMenu);
            cascadeContainer.addEventListener('mouseenter', () => {
              cascadeContainer.classList.add('is-open');
              cascadeContainer.setAttribute('aria-expanded', 'true');
              const subRect = subMenu.getBoundingClientRect();
              if (subRect.right > window.innerWidth - 10) {
                subMenu.style.left = 'auto';
                subMenu.style.right = '100%';
              } else {
                subMenu.style.left = '100%';
                subMenu.style.right = 'auto';
              }
            });
            cascadeContainer.addEventListener('mouseleave', () => {
              cascadeContainer.classList.remove('is-open');
              cascadeContainer.setAttribute('aria-expanded', 'false');
            });

            menu.appendChild(cascadeContainer);
          } else {
            const subBtn = document.createElement('button');
            subBtn.type = 'button';
            subBtn.className = `aurora-dropdown-item aurora-sub-${subItem.id}`;
            subBtn.setAttribute('role', 'menuitem');
            subBtn.textContent = subItem.text;
            subBtn.tabIndex = -1;

            // Typography visual preview and preloading
            if (item.id === 'fontSize' && subItem.commandArgs?.size) {
              subBtn.style.fontSize = String(subItem.commandArgs.size);
            }

            subBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMenu(false);

              if (subItem.id === 'link') {
                promptLinkDialog(editor);
              } else if (subItem.id === 'image') {
                promptImageDialog(editor);
              } else if (subItem.command) {
                if (item.id === 'fontSize' && subItem.commandArgs?.size) {
                  const sizeLabel = toolbarEl.querySelector('.aurora-btn-fontSize .aurora-dropdown-label');
                  if (sizeLabel) {
                    sizeLabel.textContent = String(subItem.commandArgs.size);
                  }
                }

                editor.execute(subItem.command, subItem.commandArgs);
                config?.onAction?.(subItem.command);
                editor.focus();
              }
            });

            menu.appendChild(subBtn);
          }
        });
      }

      function positionMenu() {
        const rect = btn.getBoundingClientRect();
        let top = rect.bottom + 6;
        let left = rect.left;

        menu.style.position = 'fixed';
        menu.style.zIndex = '100000';
        menu.style.top = `${Math.round(top)}px`;
        menu.style.left = `${Math.round(left)}px`;

        const menuRect = menu.getBoundingClientRect();
        if (left + menuRect.width > window.innerWidth - 10) {
          left = window.innerWidth - menuRect.width - 10;
        }
        if (left < 10) left = 10;
        menu.style.left = `${Math.round(left)}px`;

        if (top + menuRect.height > window.innerHeight - 10 && rect.top > menuRect.height + 10) {
          top = rect.top - menuRect.height - 6;
          menu.style.top = `${Math.round(top)}px`;
        }
      }

      function toggleMenu(open?: boolean) {
        const isOpen = open !== undefined ? open : !menu.classList.contains('is-open');
        if (isOpen) {
          portaledMenus.forEach((pm) => {
            if (pm.menu !== menu) {
              pm.menu.classList.remove('is-open');
              pm.btn.setAttribute('aria-expanded', 'false');
            }
          });
          menu.classList.add('is-open');
          positionMenu();
        } else {
          menu.classList.remove('is-open');
        }
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMenu(true);
          const firstItem = menu.querySelector<HTMLButtonElement>('.aurora-dropdown-item');
          firstItem?.focus();
        } else {
          handleKeydown(e, index);
        }
      });

      menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          toggleMenu(false);
          btn.focus();
        }
      });

      dropdownContainer.appendChild(btn);
      if (typeof document !== 'undefined') {
        document.body.appendChild(menu);
      } else {
        dropdownContainer.appendChild(menu);
      }
      portaledMenus.push({ menu, btn, position: positionMenu });
      currentGroupEl.appendChild(dropdownContainer);
      buttons.push(btn);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', t(item.labelKey, item.id));
      btn.className = `aurora-toolbar-btn aurora-btn-${item.id}`;
      btn.textContent = item.text || item.id;
      btn.tabIndex = index === 0 ? 0 : -1;

      if (item.markName) {
        btn.setAttribute('aria-pressed', 'false');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.id === 'link') {
          promptLinkDialog(editor);
        } else if (item.id === 'image') {
          promptImageDialog(editor);
        } else if (item.command) {
          editor.execute(item.command, item.commandArgs);
          config?.onAction?.(item.command);
          editor.focus();
        }
      });

      btn.addEventListener('keydown', (e) => {
        handleKeydown(e, index);
      });

      buttons.push(btn);
      currentGroupEl.appendChild(btn);
    }
  });

  function setFocus(index: number) {
    buttons.forEach((b, i) => {
      b.tabIndex = i === index ? 0 : -1;
    });
    buttons[index]?.focus();
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocus((index + 1) % buttons.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocus((index - 1 + buttons.length) % buttons.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocus(0);
        break;
      case 'End':
        e.preventDefault();
        setFocus(buttons.length - 1);
        break;
    }
  }

  function updateActiveMarks(activeMarks: string[]) {
    items.forEach((item, idx) => {
      if (item.markName) {
        const isActive = activeMarks.includes(item.markName);
        buttons[idx]?.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
          buttons[idx]?.classList.add('is-active');
        } else {
          buttons[idx]?.classList.remove('is-active');
        }
      }
    });
  }

  const onDocClick = (e: MouseEvent) => {
    const target = e.target as Node;
    const isInsideToolbar = toolbarEl.contains(target);
    const isInsideOpenMenu = portaledMenus.some((pm) => pm.menu.contains(target));
    if (!isInsideToolbar && !isInsideOpenMenu) {
      portaledMenus.forEach((pm) => {
        pm.menu.classList.remove('is-open');
        pm.btn.setAttribute('aria-expanded', 'false');
      });
    }
  };

  const onWindowScrollOrResize = () => {
    portaledMenus.forEach((pm) => {
      if (pm.menu.classList.contains('is-open')) {
        pm.position();
      }
    });
  };

  const onDocKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      portaledMenus.forEach((pm) => {
        pm.menu.classList.remove('is-open');
        pm.btn.setAttribute('aria-expanded', 'false');
      });
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onWindowScrollOrResize, true);
    window.addEventListener('resize', onWindowScrollOrResize);
    window.addEventListener('keydown', onDocKeydown);
  }

  const unsubSelection = editor.on('selectionChange', (selection: SelectionState) => {
    updateActiveMarks(selection.activeMarks || []);

    // 1. Update Style Dropdown Label
    const styleLabel = toolbarEl.querySelector('.aurora-btn-style .aurora-dropdown-label');
    if (styleLabel) {
      if (selection.activeBlockType === 'heading') {
        styleLabel.textContent = 'Heading';
      } else if (selection.activeBlockType === 'blockquote') {
        styleLabel.textContent = 'Quote';
      } else if (selection.activeBlockType === 'code_block') {
        styleLabel.textContent = 'Code block';
      } else {
        styleLabel.textContent = 'Normal text';
      }
    }

    // 2. Update Align Dropdown Active Item and Label
    const activeAlign = selection.activeAlignment || 'left';
    const alignLabel = toolbarEl.querySelector('.aurora-btn-align .aurora-dropdown-label');
    if (alignLabel) {
      const alignIcons: Record<string, string> = {
        left: '⫷ Left',
        center: '☰ Center',
        right: '⫸ Right',
        justify: '☷ Justify'
      };
      alignLabel.textContent = alignIcons[activeAlign] || '≡ Align';
    }

    // 3. Update Font Family Dropdown Label and Active Item
    const fontLabel = toolbarEl.querySelector('.aurora-btn-fontFamily .aurora-dropdown-label');
    if (fontLabel) {
      if (selection.activeFontFamily) {
        const found = FONT_FAMILIES.find((f) => f.family === selection.activeFontFamily);
        fontLabel.textContent = found ? found.label.split(' ')[0] : 'Font';
      } else {
        fontLabel.textContent = 'Font';
      }
    }

    document.querySelectorAll('.aurora-dropdown-menu-fontFamily .aurora-dropdown-item').forEach((itemEl) => {
      const subBtn = itemEl as HTMLButtonElement;
      if (selection.activeFontFamily && subBtn.style.fontFamily === selection.activeFontFamily) {
        subBtn.classList.add('is-active');
      } else {
        subBtn.classList.remove('is-active');
      }
    });

    // 4. Update Font Size Dropdown Label and Active Item
    const sizeLabel = toolbarEl.querySelector('.aurora-btn-fontSize .aurora-dropdown-label');
    if (sizeLabel) {
      sizeLabel.textContent = selection.activeFontSize || 'Size';
    }

    document.querySelectorAll('.aurora-dropdown-menu-fontSize .aurora-dropdown-item').forEach((itemEl) => {
      const subBtn = itemEl as HTMLButtonElement;
      if (selection.activeFontSize && subBtn.style.fontSize === selection.activeFontSize) {
        subBtn.classList.add('is-active');
      } else {
        subBtn.classList.remove('is-active');
      }
    });
  });

  const unsubChange = editor.on('change', () => {
    const doc = editor.getDocument();
    const activeMarks: string[] = [];
    doc.content.forEach((n) => {
      if (n.content) {
        n.content.forEach((c) => {
          if (c.marks) activeMarks.push(...c.marks.map((m) => m.type));
        });
      }
    });
    updateActiveMarks(Array.from(new Set(activeMarks)));
  });

  container.appendChild(toolbarEl);

  return {
    element: toolbarEl,
    destroy() {
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', onDocClick);
        window.removeEventListener('scroll', onWindowScrollOrResize, true);
        window.removeEventListener('resize', onWindowScrollOrResize);
        window.removeEventListener('keydown', onDocKeydown);
        portaledMenus.forEach((pm) => pm.menu.remove());
      }
      unsubSelection();
      unsubChange();
      toolbarEl.remove();
    }
  };
}
export { promptLinkDialog, promptImageDialog };

