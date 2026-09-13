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
  'toolbar.paragraph': 'Paragraph',
  'toolbar.bulletList': 'Bulleted list',
  'toolbar.orderedList': 'Numbered list',
  'toolbar.blockquote': 'Quote',
  'toolbar.table': 'Insert Table',
  'toolbar.link': 'Insert Link',
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
  currentDictionary = { ...DEFAULT_EN_STRINGS, ...dict };
}

export function t(key: string, fallback?: string): string {
  return currentDictionary[key] || fallback || key;
}
