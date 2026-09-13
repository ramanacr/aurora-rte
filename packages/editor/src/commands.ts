export type CommandName =
  | 'insertText'
  | 'toggleBold'
  | 'toggleItalic'
  | 'toggleUnderline'
  | 'toggleStrike'
  | 'toggleCode'
  | 'toggleSubscript'
  | 'toggleSuperscript'
  | 'setHeading'
  | 'setParagraph'
  | 'toggleBlockquote'
  | 'toggleCodeBlock'
  | 'toggleBulletList'
  | 'toggleOrderedList'
  | 'insertHorizontalRule'
  | 'setLink'
  | 'removeLink'
  | 'insertImage'
  | 'insertEmbed'
  | 'insertMention'
  | 'insertCustomBlock'
  | 'insertTable'
  | 'undo'
  | 'redo';

export interface CommandResult {
  success: boolean;
  message?: string;
}
