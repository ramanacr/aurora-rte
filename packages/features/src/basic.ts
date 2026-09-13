import type { AuroraEditor } from '@aurora/editor';

export interface BasicFormattingOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  headings?: number[];
  blockquote?: boolean;
  horizontalRule?: boolean;
}

export function basicFormatting(_options: BasicFormattingOptions = {}) {
  return {
    name: 'basicFormatting',
    init(editor: AuroraEditor) {
      return {
        toggleBold: () => editor.execute('toggleBold'),
        toggleItalic: () => editor.execute('toggleItalic'),
        toggleUnderline: () => editor.execute('toggleUnderline'),
        toggleStrike: () => editor.execute('toggleStrike'),
        toggleCode: () => editor.execute('toggleCode'),
        toggleSubscript: () => editor.execute('toggleSubscript'),
        toggleSuperscript: () => editor.execute('toggleSuperscript'),
        setHeading: (level: number) => editor.execute('setHeading', { level }),
        setParagraph: () => editor.execute('setParagraph'),
        toggleBlockquote: () => editor.execute('toggleBlockquote'),
        insertHorizontalRule: () => editor.execute('insertHorizontalRule')
      };
    }
  };
}
