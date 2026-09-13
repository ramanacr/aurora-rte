/**
 * Normalizes pasted content from Microsoft Word, Google Docs, and rich web pages.
 * Cleans proprietary MS Office XML tags, mso-* styles, SmartTags, and comments.
 */
export function cleanPastedHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  // 1. Remove XML declarations and conditional comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');
  clean = clean.replace(/<\?xml[^>]*>/gi, '');

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
  clean = clean.replace(/<p[^>]*class=["']?MsoListParagraph[^"']*["']?[^>]*>(?:<span[^>]*>[·•\-\d.]+<\/span>)?\s*([\s\S]*?)<\/p>/gi, '<li>$1</li>');

  // 5. Clean empty spans and empty class attributes
  clean = clean.replace(/<span\s*>(.*?)<\/span>/gi, '$1');
  clean = clean.replace(/\sclass=["']?Mso\w*["']?/gi, '');

  return clean;
}
