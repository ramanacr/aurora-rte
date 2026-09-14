export type LocaleDictionary = Record<string, string>;

export const DEFAULT_EN_STRINGS: LocaleDictionary = {
  'toolbar.bold': 'Bold',
  'toolbar.italic': 'Italic',
  'toolbar.underline': 'Underline',
  'toolbar.strike': 'Strikethrough',
  'toolbar.code': 'Inline Code',
  'toolbar.h1': 'Heading 1',
  'toolbar.h2': 'Heading 2',
  'toolbar.h3': 'Heading 3',
  'toolbar.h4': 'Heading 4',
  'toolbar.h5': 'Heading 5',
  'toolbar.h6': 'Heading 6',
  'toolbar.paragraph': 'Normal text',
  'toolbar.style': 'Styles',
  'toolbar.fontFamily': 'Font Family',
  'toolbar.fontSize': 'Font Size',
  'toolbar.textColor': 'Text Color',
  'toolbar.textHighlight': 'Highlight',
  'toolbar.subscript': 'Subscript',
  'toolbar.superscript': 'Superscript',
  'toolbar.clearFormatting': 'Clear Formatting',
  'toolbar.callout': 'Callout Box',
  'toolbar.details': 'Details / Accordion',
  'toolbar.tableMenu': 'Table Actions',
  'toolbar.addRowAbove': 'Add Row Above',
  'toolbar.addRowBelow': 'Add Row Below',
  'toolbar.deleteRow': 'Delete Row',
  'toolbar.addColBefore': 'Add Column Before',
  'toolbar.addColAfter': 'Add Column After',
  'toolbar.deleteCol': 'Delete Column',
  'toolbar.align': 'Alignment',
  'toolbar.alignLeft': 'Align Left',
  'toolbar.alignCenter': 'Align Center',
  'toolbar.alignRight': 'Align Right',
  'toolbar.alignJustify': 'Justify',
  'toolbar.insert': 'Insert',
  'toolbar.bulletList': 'Bulleted list',
  'toolbar.orderedList': 'Numbered list',
  'toolbar.blockquote': 'Quote',
  'toolbar.table': 'Insert Table',
  'toolbar.deleteTable': 'Delete Table',
  'toolbar.link': 'Insert Link',
  'toolbar.image': 'Insert Image',
  'toolbar.horizontalRule': 'Horizontal Rule',
  'toolbar.undo': 'Undo',
  'toolbar.redo': 'Redo',
  'dialog.close': 'Close dialog',
  'dialog.cancel': 'Cancel',
  'dialog.confirm': 'Confirm',
  'link.url': 'URL',
  'link.title': 'Link title (optional)',
  'link.save': 'Save link',
  'table.rows': 'Rows',
  'table.cols': 'Columns'
};

let currentDictionary: LocaleDictionary = { ...DEFAULT_EN_STRINGS };

export function setLocaleDictionary(dict: Partial<LocaleDictionary>): void {
  currentDictionary = { ...DEFAULT_EN_STRINGS, ...(dict as LocaleDictionary) };
}

export function t(key: string, fallback?: string): string {
  return currentDictionary[key] || fallback || key;
}
