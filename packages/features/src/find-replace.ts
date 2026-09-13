import type { AuroraEditor } from '@aurora/editor';
import type { AuroraDocument, AuroraNode } from '@aurora/model';

export interface FindMatch {
  text: string;
  count: number;
}

export function findAndReplace() {
  return {
    name: 'findAndReplace',
    init(editor: AuroraEditor) {
      return {
        find(query: string): FindMatch {
          if (!query) return { text: query, count: 0 };
          const doc = editor.getDocument();
          let count = 0;

          function scan(nodes: AuroraNode[]) {
            for (const node of nodes) {
              if (node.type === 'text' && node.text) {
                let pos = 0;
                while ((pos = node.text.toLowerCase().indexOf(query.toLowerCase(), pos)) !== -1) {
                  count++;
                  pos += query.length;
                }
              }
              if (node.content) scan(node.content);
            }
          }

          scan(doc.content || []);
          return { text: query, count };
        },

        replaceAll(query: string, replacement: string): { replacedCount: number } {
          if (!query) return { replacedCount: 0 };
          const doc = editor.getDocument();
          let replacedCount = 0;

          function replaceInNodes(nodes: AuroraNode[]): AuroraNode[] {
            return nodes.map((node) => {
              if (node.type === 'text' && node.text) {
                const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const matches = node.text.match(regex);
                if (matches) {
                  replacedCount += matches.length;
                  return {
                    ...node,
                    text: node.text.replace(regex, replacement)
                  };
                }
              }
              if (node.content) {
                return {
                  ...node,
                  content: replaceInNodes(node.content)
                };
              }
              return node;
            });
          }

          const updatedDoc: AuroraDocument = {
            ...doc,
            content: replaceInNodes(doc.content || [])
          };

          if (replacedCount > 0) {
            editor.setDocument(updatedDoc);
          }

          return { replacedCount };
        }
      };
    }
  };
}
