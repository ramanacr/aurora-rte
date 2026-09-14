/**
 * Normalizes pasted content from Microsoft Word, Google Docs, and rich web pages.
 * Cleans proprietary MS Office XML tags, mso-* styles, SmartTags, and comments.
 */
export function cleanPastedHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  // 1. Remove XML declarations, style tags, and conditional comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');
  clean = clean.replace(/<\?xml[^>]*>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Remove Word specific tags (<o:p>, <w:worddocument>, etc.)
  clean = clean.replace(/<\/?\w+:[^>]*>/gi, '');

  // 3. Remove mso-* CSS properties from inline style attributes
  clean = clean.replace(/style="([^"]*)"/gi, (_match, styleContent) => {
    const cleanedStyles = styleContent
      .split(';')
      .filter((rule: string) => {
        const trimmed = rule.trim().toLowerCase();
        return (
          trimmed &&
          !trimmed.startsWith('mso-') &&
          !trimmed.startsWith('tab-stops') &&
          !trimmed.startsWith('font-family')
        );
      })
      .join(';');
    return cleanedStyles ? `style="${cleanedStyles}"` : '';
  });

  // 4. Normalize MS Word bullet lists: convert paragraphs with list markers to clean <li>
  clean = clean.replace(/<p[^>]*class=["']?MsoListParagraph[^"']*["']?[^>]*>([\s\S]*?)<\/p>/gi, (_match, inner) => {
    const stripped = inner.replace(/^(?:<span[^>]*>|[·•\-\d.\s]|&nbsp;|<\/span>)+/gi, '').trim();
    return `<li>${stripped}</li>`;
  });

  // 5. Clean empty spans and empty class attributes
  clean = clean.replace(/<span\s*>(.*?)<\/span>/gi, '$1');
  clean = clean.replace(/\sclass=["']?Mso\w*["']?/gi, '');

  return clean;
}

/**
 * Formats raw HTML string with clean indentation and newlines for readable inspector display.
 */
export function formatHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const singleTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  // Insert token boundaries around tags while preserving inner text
  const tokens = html
    .replace(/(<[^>]+>)/g, '\n$1\n')
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  let formatted = '';
  let indentLevel = 0;
  const indentStr = '  ';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.startsWith('</')) {
      // Closing tag
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += `${indentStr.repeat(indentLevel)}${token}\n`;
    } else if (token.startsWith('<') && !token.startsWith('<!')) {
      const match = /^<([a-zA-Z0-9_-]+)/.exec(token);
      const tag = match ? match[1].toLowerCase() : '';
      const isSelfClosing = token.endsWith('/>') || singleTags.has(tag);

      // Check if next token is text and following token is the closing tag for this element
      const nextToken = tokens[i + 1];
      const afterNext = tokens[i + 2];
      if (
        !isSelfClosing &&
        nextToken &&
        !nextToken.startsWith('<') &&
        afterNext === `</${tag}>`
      ) {
        // Render inline on one line: <p>Text</p>
        formatted += `${indentStr.repeat(indentLevel)}${token}${nextToken}${afterNext}\n`;
        i += 2; // skip text and closing tag
      } else {
        formatted += `${indentStr.repeat(indentLevel)}${token}\n`;
        if (!isSelfClosing) {
          indentLevel++;
        }
      }
    } else {
      // Standalone text or doctype/comment
      formatted += `${indentStr.repeat(indentLevel)}${token}\n`;
    }
  }

  return formatted.trim();
}

