import type { AuroraEditor } from '@aurora/editor';
import type { HtmlElementDefinition, RteContext } from './types.js';
import { BUILT_IN_COMPOSITE_TEMPLATES, renderTemplateToHtml } from './composite-templates.js';
import { getUserPreferencesManager } from './user-preferences.js';

export interface InsertionResult {
  success: boolean;
  strategyUsed: string;
  error?: string;
}

/**
 * Dispatches and executes an insertion of an HTML element definition into an AuroraEditor instance
 */
export function insertHtmlElement(
  editor: AuroraEditor,
  def: HtmlElementDefinition,
  _context?: RteContext,
  customAttributes?: Record<string, string>
): InsertionResult {
  try {
    const prefs = getUserPreferencesManager();
    prefs.recordUsage(def.tagName);

    // 1. Composite Elements
    if (def.isComposite && def.templateId && BUILT_IN_COMPOSITE_TEMPLATES[def.templateId]) {
      const template = BUILT_IN_COMPOSITE_TEMPLATES[def.templateId];
      const html = renderTemplateToHtml(template, customAttributes);
      editor.execute('insertHtml', { html });
      return { success: true, strategyUsed: 'composite' };
    }

    // Special case for built-in table
    if (def.tagName === 'table') {
      editor.execute('insertTable', { rows: 3, columns: 3 });
      return { success: true, strategyUsed: 'composite' };
    }

    // Special case for lists
    if (def.tagName === 'ul') {
      editor.execute('toggleBulletList');
      return { success: true, strategyUsed: 'composite' };
    }
    if (def.tagName === 'ol') {
      editor.execute('toggleOrderedList');
      return { success: true, strategyUsed: 'composite' };
    }

    // Special case for headings
    if (/^h[1-6]$/.test(def.tagName)) {
      const level = parseInt(def.tagName[1], 10);
      editor.execute('setHeading', { level });
      return { success: true, strategyUsed: 'block' };
    }

    // Special case for paragraph
    if (def.tagName === 'p') {
      editor.execute('setParagraph');
      return { success: true, strategyUsed: 'block' };
    }

    // Special case for blockquote
    if (def.tagName === 'blockquote') {
      editor.execute('toggleBlockquote');
      return { success: true, strategyUsed: 'block' };
    }

    // Special case for hr
    if (def.tagName === 'hr') {
      editor.execute('insertHorizontalRule');
      return { success: true, strategyUsed: 'block' };
    }

    // Special case for pre/codeblock
    if (def.tagName === 'pre' || def.tagName === 'codeblock') {
      editor.execute('toggleCodeBlock');
      return { success: true, strategyUsed: 'block' };
    }

    // Special case for image
    if (def.tagName === 'img') {
      const src = customAttributes?.src || 'https://placehold.co/600x400';
      const alt = customAttributes?.alt || 'Image';
      editor.execute('insertImage', { src, alt });
      return { success: true, strategyUsed: 'configuration' };
    }

    // 2. Generic Inline Elements
    if (def.isInline) {
      // Inline marks
      if (def.tagName === 'strong' || def.tagName === 'b') {
        editor.execute('toggleBold');
        return { success: true, strategyUsed: 'inline' };
      }
      if (def.tagName === 'em' || def.tagName === 'i') {
        editor.execute('toggleItalic');
        return { success: true, strategyUsed: 'inline' };
      }
      if (def.tagName === 'u') {
        editor.execute('toggleUnderline');
        return { success: true, strategyUsed: 'inline' };
      }
      if (def.tagName === 's' || def.tagName === 'strike') {
        editor.execute('toggleStrike');
        return { success: true, strategyUsed: 'inline' };
      }
      if (def.tagName === 'code') {
        editor.execute('toggleCode');
        return { success: true, strategyUsed: 'inline' };
      }

      // Other inlines (span, mark, kbd, time, etc.) via HTML injection
      const attrs = customAttributes
        ? ' ' + Object.entries(customAttributes).map(([k, v]) => `${k}="${v}"`).join(' ')
        : '';
      const html = `<${def.tagName}${attrs}>${def.displayName}</${def.tagName}>`;
      editor.execute('insertHtml', { html });
      return { success: true, strategyUsed: 'inline' };
    }

    // 3. Generic Containers & Blocks
    const attrs = customAttributes
      ? ' ' + Object.entries(customAttributes).map(([k, v]) => `${k}="${v}"`).join(' ')
      : '';
    const html = `<${def.tagName}${attrs}><p>${def.displayName} content</p></${def.tagName}>`;
    editor.execute('insertHtml', { html });
    return { success: true, strategyUsed: 'container' };
  } catch (err) {
    return {
      success: false,
      strategyUsed: def.insertionMode,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
