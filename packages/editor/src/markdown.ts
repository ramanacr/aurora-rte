import type { AuroraDocument, AuroraNode, AuroraMark } from '@aurora/model';
import { validateDocument } from '@aurora/model';

/**
 * Parses markdown into AuroraDocument.
 */
export function importMarkdown(markdown: string): AuroraDocument {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const nodes: AuroraNode[] = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  function parseInline(text: string): AuroraNode[] {
    const inlines: AuroraNode[] = [];
    // Regex for bold (**text**), italic (*text*), link [text](url), code (`text`)
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|([^*`[]+))/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match[2]) {
        // bold
        inlines.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] });
      } else if (match[3]) {
        // italic
        inlines.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] });
      } else if (match[4]) {
        // inline code
        inlines.push({ type: 'text', text: match[4], marks: [{ type: 'code' }] });
      } else if (match[5] && match[6]) {
        // link
        inlines.push({
          type: 'text',
          text: match[5],
          marks: [{ type: 'link', attrs: { href: match[6] } }]
        });
      } else if (match[7]) {
        inlines.push({ type: 'text', text: match[7] });
      }
    }

    return inlines.length > 0 ? inlines : [{ type: 'text', text }];
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        inCodeBlock = false;
        nodes.push({
          type: 'code_block',
          attrs: { language: codeLang },
          content: [{ type: 'text', text: codeLines.join('\n') }]
        });
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading: # H1, ## H2 ...
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      nodes.push({
        type: 'heading',
        attrs: { level },
        content: parseInline(headingMatch[2])
      });
      i++;
      continue;
    }

    // Blockquote: > text
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s?/, '');
      nodes.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: parseInline(quoteText) }]
      });
      i++;
      continue;
    }

    // Horizontal rule: --- or ***
    if (/^(\*{3,}|-{3,})$/.test(line.trim())) {
      nodes.push({ type: 'horizontal_rule' });
      i++;
      continue;
    }

    // Unordered list: - or *
    if (/^[-*]\s+/.test(line)) {
      const listItems: AuroraNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*]\s+/, '');
        listItems.push({
          type: 'list_item',
          content: [{ type: 'paragraph', content: parseInline(itemText) }]
        });
        i++;
      }
      nodes.push({
        type: 'bullet_list',
        content: listItems
      });
      continue;
    }

    // Ordered list: 1.
    if (/^\d+\.\s+/.test(line)) {
      const listItems: AuroraNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '');
        listItems.push({
          type: 'list_item',
          content: [{ type: 'paragraph', content: parseInline(itemText) }]
        });
        i++;
      }
      nodes.push({
        type: 'ordered_list',
        content: listItems
      });
      continue;
    }

    // Standard paragraph
    nodes.push({
      type: 'paragraph',
      content: parseInline(line)
    });
    i++;
  }

  if (nodes.length === 0) {
    nodes.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] });
  }

  return validateDocument({
    format: 'aurora',
    version: 1,
    content: nodes
  });
}

/**
 * Serializes an AuroraDocument to Markdown.
 */
export function exportMarkdown(doc: AuroraDocument): string {
  function serializeMark(mark: AuroraMark, inner: string): string {
    switch (mark.type) {
      case 'bold':
        return `**${inner}**`;
      case 'italic':
        return `*${inner}*`;
      case 'code':
        return `\`${inner}\``;
      case 'strike':
        return `~~${inner}~~`;
      case 'link':
        return `[${inner}](${mark.attrs?.href || ''})`;
      default:
        return inner;
    }
  }

  function serializeNode(node: AuroraNode): string {
    if (node.type === 'text') {
      let text = node.text || '';
      if (node.marks) {
        for (const m of node.marks) {
          text = serializeMark(m, text);
        }
      }
      return text;
    }

    const inner = (node.content || []).map(serializeNode).join('');

    switch (node.type) {
      case 'paragraph':
        return `${inner}\n\n`;
      case 'heading': {
        const prefix = '#'.repeat(Number(node.attrs?.level || 1));
        return `${prefix} ${inner}\n\n`;
      }
      case 'blockquote':
        return `> ${inner}\n\n`;
      case 'code_block': {
        const lang = node.attrs?.language || '';
        return `\`\`\`${lang}\n${inner}\n\`\`\`\n\n`;
      }
      case 'horizontal_rule':
        return `---\n\n`;
      case 'bullet_list':
        return `${(node.content || []).map((li) => `- ${(li.content || []).map(serializeNode).join('').trim()}`).join('\n')}\n\n`;
      case 'ordered_list':
        return `${(node.content || []).map((li, idx) => `${idx + 1}. ${(li.content || []).map(serializeNode).join('').trim()}`).join('\n')}\n\n`;
      default:
        return inner;
    }
  }

  return (doc.content || []).map(serializeNode).join('').trim();
}
