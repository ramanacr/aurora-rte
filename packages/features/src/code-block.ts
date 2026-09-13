import type { AuroraEditor } from '@aurora/editor';

export const SUPPORTED_CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'python',
  'markdown',
  'sql',
  'shell'
];

export function codeBlock() {
  return {
    name: 'codeBlock',
    init(editor: AuroraEditor) {
      return {
        setCodeBlock: (language = 'typescript') =>
          editor.execute('toggleCodeBlock', { language })
      };
    }
  };
}
