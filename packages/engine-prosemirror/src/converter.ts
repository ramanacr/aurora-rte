import { Node as PMNode, Schema, Mark } from 'prosemirror-model';
import type { AuroraDocument, AuroraNode, AuroraMark } from '@aurora/model';
import { auroraSchema } from './schema.js';

export function auroraToProseMirror(doc: AuroraDocument, schema: Schema = auroraSchema): PMNode {
  function convertNode(node: AuroraNode): PMNode {
    const nodeType = schema.nodes[node.type];
    if (!nodeType) {
      throw new Error(`Unknown node type in schema: "${node.type}"`);
    }

    const marks: Mark[] = [];
    if (node.marks) {
      for (const m of node.marks) {
        const markType = schema.marks[m.type];
        if (markType) {
          marks.push(markType.create(m.attrs));
        }
      }
    }

    if (node.type === 'text') {
      return schema.text(node.text || '', marks);
    }

    const children: PMNode[] = [];
    if (node.content) {
      for (const child of node.content) {
        children.push(convertNode(child));
      }
    }

    return nodeType.create(node.attrs, children, marks);
  }

  const rootChildren: PMNode[] = [];
  if (Array.isArray(doc.content)) {
    for (const child of doc.content) {
      rootChildren.push(convertNode(child));
    }
  }

  // Ensure doc has at least one block if empty
  if (rootChildren.length === 0) {
    rootChildren.push(schema.nodes.paragraph.create());
  }

  return schema.nodes.doc.create(null, rootChildren);
}

export function proseMirrorToAurora(pmDoc: PMNode, meta?: Record<string, unknown>): AuroraDocument {
  function convertNode(node: PMNode): AuroraNode {
    const auroraMarks: AuroraMark[] = [];
    for (const mark of node.marks) {
      auroraMarks.push({
        type: mark.type.name,
        ...(Object.keys(mark.attrs).length > 0 ? { attrs: mark.attrs } : {})
      });
    }

    if (node.isText) {
      return {
        type: 'text',
        text: node.text || '',
        ...(auroraMarks.length > 0 ? { marks: auroraMarks } : {})
      };
    }

    const content: AuroraNode[] = [];
    node.forEach((child) => {
      content.push(convertNode(child));
    });

    return {
      type: node.type.name,
      ...(Object.keys(node.attrs).length > 0 ? { attrs: node.attrs } : {}),
      ...(content.length > 0 ? { content } : {}),
      ...(auroraMarks.length > 0 ? { marks: auroraMarks } : {})
    };
  }

  const content: AuroraNode[] = [];
  pmDoc.forEach((child) => {
    content.push(convertNode(child));
  });

  return {
    format: 'aurora',
    version: 1,
    content,
    ...(meta ? { meta: { ...meta } } : {})
  };
}
