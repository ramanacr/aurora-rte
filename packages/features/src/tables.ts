import type { AuroraEditor } from '@aurora/editor';

export interface TableOptions {
  maxRows?: number;
  maxCols?: number;
}

export function tables(options: TableOptions = {}) {
  const maxRows = options.maxRows ?? 100;
  const maxCols = options.maxCols ?? 50;

  return {
    name: 'tables',
    init(editor: AuroraEditor) {
      return {
        insertTable: (rows = 3, cols = 3, header = true) => {
          const boundedRows = Math.min(Math.max(1, rows), maxRows);
          const boundedCols = Math.min(Math.max(1, cols), maxCols);
          return editor.execute('insertTable', { rows: boundedRows, cols: boundedCols, header });
        }
      };
    }
  };
}
