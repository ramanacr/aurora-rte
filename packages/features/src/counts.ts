import type { AuroraDocument, AuroraNode } from '@aurora/model';

export interface DocumentCounts {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  paragraphs: number;
}

export function calculateCounts(doc: AuroraDocument): DocumentCounts {
  let text = '';
  let paragraphs = 0;

  function collect(nodes: AuroraNode[]) {
    for (const node of nodes) {
      if (node.type === 'text' && node.text) {
        text += node.text;
      }
      if (node.type === 'paragraph' || node.type === 'heading') {
        paragraphs++;
        text += ' ';
      }
      if (node.content) {
        collect(node.content);
      }
    }
  }

  collect(doc.content || []);

  const characters = text.trim().length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return {
    characters,
    charactersNoSpaces,
    words,
    paragraphs: Math.max(paragraphs, doc.content?.length || 0)
  };
}
