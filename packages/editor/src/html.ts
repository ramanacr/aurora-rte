import type { AuroraDocument, AuroraNode, AuroraMark } from '@aurora/model';
import { validateDocument } from '@aurora/model';

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'hr', 'ul', 'ol', 'li', 'table', 'tbody', 'thead', 'tr', 'td', 'th',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'strike', 'sub', 'sup',
  'a', 'img', 'br', 'span', 'div'
]);

const ALLOWED_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

export function sanitizeUrl(url: string, allowImageData = false): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Special case: safe data image URIs
  if (allowImageData && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:')
  ) {
    return null;
  }

  // Relative paths, bare filenames, or anchors
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (ALLOWED_URL_SCHEMES.includes(parsed.protocol.toLowerCase())) {
      return trimmed;
    }
  } catch {}

  return null;
}

/**
 * Parses raw HTML into an AuroraDocument with strict allow-list sanitization.
 * Strips scripts, styles, dangerous attributes, unapproved protocols, active SVGs, and forms.
 */
export function importHtml(html: string): AuroraDocument {
  // Strip dangerous blocks before parsing
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

  const nodes: AuroraNode[] = [];

  // Lightweight resilient DOM / markup parsing
  // Matches block tags or fallback to paragraphs
  const blockRegex = /<(p|h[1-6]|blockquote|pre|hr|ul|ol|table|div)([^>]*)>([\s\S]*?)<\/\1>|<(hr|img)([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  function parseInline(contentHtml: string): AuroraNode[] {
    const inlines: AuroraNode[] = [];
    const inlineTagRegex = /<(\/?)(strong|b|em|i|u|s|del|strike|code|sub|sup|a|img|br|span)([^>]*)>|([^<]+)/gi;
    let currentMarks: AuroraMark[] = [];
    let inlineMatch: RegExpExecArray | null;

    while ((inlineMatch = inlineTagRegex.exec(contentHtml)) !== null) {
      const isClosing = inlineMatch[1] === '/';
      const tagName = inlineMatch[2]?.toLowerCase();
      const rawAttrs = inlineMatch[3] || '';
      const textChunk = inlineMatch[4];

      if (textChunk) {
        // Decode HTML entities
        const decoded = textChunk
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ');

        inlines.push({
          type: 'text',
          text: decoded,
          ...(currentMarks.length > 0 ? { marks: [...currentMarks] } : {})
        });
        continue;
      }

      if (tagName === 'br') {
        inlines.push({ type: 'hard_break' });
        continue;
      }

      if (tagName === 'img' && !isClosing) {
        const srcMatch = /src=["']([^"']*)["']/i.exec(rawAttrs);
        const altMatch = /alt=["']([^"']*)["']/i.exec(rawAttrs);
        const titleMatch = /title=["']([^"']*)["']/i.exec(rawAttrs);
        const safeSrc = srcMatch ? sanitizeUrl(srcMatch[1], true) : null;
        if (safeSrc) {
          inlines.push({
            type: 'image',
            attrs: {
              src: safeSrc,
              alt: altMatch ? altMatch[1] : '',
              title: titleMatch ? titleMatch[1] : ''
            }
          });
        }
        continue;
      }

      if (isClosing) {
        // Remove mark
        const markType =
          tagName === 'strong' || tagName === 'b' ? 'bold' :
          tagName === 'em' || tagName === 'i' ? 'italic' :
          tagName === 's' || tagName === 'del' || tagName === 'strike' ? 'strike' :
          tagName === 'u' ? 'underline' :
          tagName === 'sub' ? 'subscript' :
          tagName === 'sup' ? 'superscript' :
          tagName;
        currentMarks = currentMarks.filter((m) => m.type !== markType);
      } else {
        // Add mark
        if (tagName === 'a') {
          const hrefMatch = /href=["']([^"']*)["']/i.exec(rawAttrs);
          const safeHref = hrefMatch ? sanitizeUrl(hrefMatch[1]) : null;
          if (safeHref) {
            currentMarks.push({
              type: 'link',
              attrs: { href: safeHref }
            });
          }
        } else if (['strong', 'b'].includes(tagName)) {
          currentMarks.push({ type: 'bold' });
        } else if (['em', 'i'].includes(tagName)) {
          currentMarks.push({ type: 'italic' });
        } else if (tagName === 'u') {
          currentMarks.push({ type: 'underline' });
        } else if (['s', 'del', 'strike'].includes(tagName)) {
          currentMarks.push({ type: 'strike' });
        } else if (tagName === 'code') {
          currentMarks.push({ type: 'code' });
        } else if (tagName === 'sub') {
          currentMarks.push({ type: 'subscript' });
        } else if (tagName === 'sup') {
          currentMarks.push({ type: 'superscript' });
        }
      }
    }

    return inlines.length > 0 ? inlines : [{ type: 'text', text: '' }];
  }

  while ((match = blockRegex.exec(sanitized)) !== null) {
    const tag = (match[1] || match[4]).toLowerCase();
    const rawAttrs = match[2] || match[5] || '';
    const inner = match[3] || '';

    if (tag === 'p') {
      nodes.push({
        type: 'paragraph',
        content: parseInline(inner)
      });
    } else if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10);
      nodes.push({
        type: 'heading',
        attrs: { level },
        content: parseInline(inner)
      });
    } else if (tag === 'blockquote') {
      nodes.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: parseInline(inner) }]
      });
    } else if (tag === 'pre') {
      const codeMatch = /<code\b[^>]*>([\s\S]*?)<\/code>/i.exec(inner);
      const codeText = codeMatch ? codeMatch[1] : inner;
      nodes.push({
        type: 'code_block',
        content: [{ type: 'text', text: codeText.replace(/&lt;/g, '<').replace(/&gt;/g, '>') }]
      });
    } else if (tag === 'hr') {
      nodes.push({ type: 'horizontal_rule' });
    } else if (tag === 'img') {
      const srcMatch = /src=["']([^"']*)["']/i.exec(rawAttrs);
      const altMatch = /alt=["']([^"']*)["']/i.exec(rawAttrs);
      const safeSrc = srcMatch ? sanitizeUrl(srcMatch[1], true) : null;
      if (safeSrc) {
        nodes.push({
          type: 'image',
          attrs: { src: safeSrc, alt: altMatch ? altMatch[1] : '' }
        });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const items: AuroraNode[] = [];
      const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        items.push({
          type: 'list_item',
          content: [{ type: 'paragraph', content: parseInline(liMatch[1]) }]
        });
      }
      nodes.push({
        type: tag === 'ul' ? 'bullet_list' : 'ordered_list',
        content: items.length > 0 ? items : [{ type: 'list_item', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }]
      });
    }
  }

  // If no blocks matched, parse as body text
  if (nodes.length === 0) {
    const cleanText = sanitized.replace(/<[^>]+>/g, '').trim();
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: cleanText }]
    });
  }

  return validateDocument({
    format: 'aurora',
    version: 1,
    content: nodes
  });
}

/**
 * Serializes an AuroraDocument to clean, deterministic HTML.
 */
export function exportHtml(doc: AuroraDocument): string {
  function serializeMark(mark: AuroraMark, inner: string): string {
    switch (mark.type) {
      case 'bold':
        return `<strong>${inner}</strong>`;
      case 'italic':
        return `<em>${inner}</em>`;
      case 'underline':
        return `<u>${inner}</u>`;
      case 'strike':
        return `<s>${inner}</s>`;
      case 'code':
        return `<code>${inner}</code>`;
      case 'subscript':
        return `<sub>${inner}</sub>`;
      case 'superscript':
        return `<sup>${inner}</sup>`;
      case 'link': {
        const href = mark.attrs?.href ? sanitizeUrl(String(mark.attrs.href)) : null;
        if (!href) return inner;
        return `<a href="${href}" rel="noopener noreferrer">${inner}</a>`;
      }
      default:
        return inner;
    }
  }

  function serializeNode(node: AuroraNode): string {
    if (node.type === 'text') {
      let text = (node.text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      if (node.marks && node.marks.length > 0) {
        for (const m of node.marks) {
          text = serializeMark(m, text);
        }
      }
      return text;
    }

    const inner = (node.content || []).map(serializeNode).join('');

    switch (node.type) {
      case 'paragraph':
        return `<p>${inner}</p>`;
      case 'heading': {
        const level = node.attrs?.level || 1;
        return `<h${level}>${inner}</h${level}>`;
      }
      case 'blockquote':
        return `<blockquote>${inner}</blockquote>`;
      case 'code_block': {
        const lang = node.attrs?.language ? ` class="language-${node.attrs.language}"` : '';
        return `<pre><code${lang}>${inner}</code></pre>`;
      }
      case 'horizontal_rule':
        return '<hr>';
      case 'bullet_list':
        return `<ul>${inner}</ul>`;
      case 'ordered_list':
        return `<ol>${inner}</ol>`;
      case 'list_item':
        return `<li>${inner}</li>`;
      case 'table':
        return `<table><tbody>${inner}</tbody></table>`;
      case 'table_row':
        return `<tr>${inner}</tr>`;
      case 'table_cell':
        return `<td>${inner}</td>`;
      case 'table_header':
        return `<th>${inner}</th>`;
      case 'image': {
        const src = node.attrs?.src ? sanitizeUrl(String(node.attrs.src), true) : '';
        const alt = node.attrs?.alt ? String(node.attrs.alt).replace(/"/g, '&quot;') : '';
        return src ? `<img src="${src}" alt="${alt}">` : '';
      }
      case 'embed': {
        const url = node.attrs?.url ? sanitizeUrl(String(node.attrs.url)) : '';
        const provider = node.attrs?.provider || '';
        return `<div data-aurora-embed="true" data-url="${url}" data-provider="${provider}"></div>`;
      }
      case 'custom_block': {
        const extId = node.attrs?.extensionId || '';
        const dataStr = JSON.stringify(node.attrs?.data || {}).replace(/"/g, '&quot;');
        return `<div data-aurora-custom-block="true" data-extension-id="${extId}" data-custom-data="${dataStr}"></div>`;
      }
      case 'mention': {
        const id = node.attrs?.id || '';
        const label = node.attrs?.label || '';
        return `<span data-mention-id="${id}" class="aurora-mention">@${label}</span>`;
      }
      case 'hard_break':
        return '<br>';
      default:
        return inner;
    }
  }

  return (doc.content || []).map(serializeNode).join('');
}
