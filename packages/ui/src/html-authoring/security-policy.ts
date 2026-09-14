import type { RtePolicy, EditorMode } from './types.js';

/**
 * Standard security policies by editor mode
 */
export const STANDARD_POLICIES: Record<EditorMode, RtePolicy> = {
  standard: {
    allowedElements: [], // empty means all standard non-restricted allowed
    restrictedElements: ['script', 'style', 'font', 'marquee', 'center', 'strike'],
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'title', 'dir', 'lang', 'aria-*', 'data-*'],
      'a': ['href', 'target', 'rel', 'title'],
      'img': ['src', 'alt', 'width', 'height', 'loading'],
      'iframe': ['src', 'title', 'width', 'height', 'allowfullscreen', 'frameborder'],
      'input': ['type', 'name', 'value', 'placeholder', 'disabled', 'required'],
      'button': ['type', 'disabled', 'name', 'value'],
      'details': ['open'],
      'dialog': ['open']
    },
    allowRawHtml: false,
    allowCustomElements: false,
    allowHeadEditing: false,
    allowScripts: false,
    allowedUrlProtocols: ['http:', 'https:', 'mailto:', 'tel:']
  },
  advanced: {
    allowedElements: [],
    restrictedElements: ['script'],
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'title', 'dir', 'lang', 'aria-*', 'data-*'],
      'a': ['href', 'target', 'rel', 'title'],
      'img': ['src', 'alt', 'width', 'height', 'loading'],
      'iframe': ['src', 'title', 'width', 'height', 'allowfullscreen', 'frameborder'],
      'video': ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height'],
      'audio': ['src', 'controls', 'autoplay', 'loop', 'muted'],
      'input': ['type', 'name', 'value', 'placeholder', 'disabled', 'required'],
      'select': ['name', 'disabled', 'required', 'multiple', 'size'],
      'option': ['value', 'selected', 'disabled'],
      'button': ['type', 'disabled', 'name', 'value'],
      'details': ['open'],
      'dialog': ['open']
    },
    allowRawHtml: true,
    allowCustomElements: true,
    allowHeadEditing: false,
    allowScripts: false,
    allowedUrlProtocols: ['http:', 'https:', 'mailto:', 'tel:']
  },
  developer: {
    allowedElements: [],
    restrictedElements: [],
    allowedAttributes: { '*': ['*'] },
    allowRawHtml: true,
    allowCustomElements: true,
    allowHeadEditing: true,
    allowScripts: true,
    allowedUrlProtocols: ['http:', 'https:', 'mailto:', 'tel:', 'data:']
  },
  email: {
    allowedElements: [
      'p', 'span', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'img',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'hr', 'br', 'div'
    ],
    restrictedElements: ['script', 'style', 'iframe', 'object', 'embed', 'video', 'audio', 'form', 'input', 'button', 'dialog', 'details'],
    allowedAttributes: {
      '*': ['style', 'class', 'align', 'valign', 'width', 'height', 'bgcolor'],
      'a': ['href', 'target', 'title'],
      'img': ['src', 'alt', 'width', 'height', 'border']
    },
    allowRawHtml: false,
    allowCustomElements: false,
    allowHeadEditing: false,
    allowScripts: false,
    allowedUrlProtocols: ['http:', 'https:', 'mailto:']
  },
  cms: {
    allowedElements: [],
    restrictedElements: ['script', 'object', 'embed'],
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'title', 'aria-*', 'data-*'],
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height']
    },
    allowRawHtml: false,
    allowCustomElements: true,
    allowHeadEditing: false,
    allowScripts: false,
    allowedUrlProtocols: ['http:', 'https:', 'mailto:', 'tel:']
  }
};

/**
 * Validates whether a URL uses an allowed protocol
 */
export function isValidUrl(url: string, allowedProtocols: string[] = ['http:', 'https:', 'mailto:', 'tel:']): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return true; // Relative URLs and anchor links are permitted
  }

  // Explicitly disallow javascript: and vbscript: URLs
  if (/^(javascript|vbscript):/i.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, 'https://aurora.internal');
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Migrates legacy HTML elements to modern semantic equivalents (Document 11)
 */
export function migrateLegacyHtml(html: string): string {
  let migrated = html;

  // <font color="red" face="Arial"> -> <span style="...">
  migrated = migrated.replace(/<font\b([^>]*)>(.*?)<\/font>/gi, (_match, attrs, content) => {
    let styles = '';
    const colorMatch = attrs.match(/color=["']([^"']+)["']/i);
    if (colorMatch) styles += `color:${colorMatch[1]};`;
    const faceMatch = attrs.match(/face=["']([^"']+)["']/i);
    if (faceMatch) styles += `font-family:${faceMatch[1]};`;
    const sizeMatch = attrs.match(/size=["']([^"']+)["']/i);
    if (sizeMatch) styles += `font-size:${sizeMatch[1]}em;`;

    return `<span style="${styles}">${content}</span>`;
  });

  // <center> -> <div style="text-align: center;">
  migrated = migrated.replace(/<center\b[^>]*>(.*?)<\/center>/gi, '<div style="text-align: center;">$1</div>');

  // <strike> -> <s>
  migrated = migrated.replace(/<strike\b[^>]*>(.*?)<\/strike>/gi, '<s>$1</s>');

  // <marquee> -> <div>
  migrated = migrated.replace(/<marquee\b[^>]*>(.*?)<\/marquee>/gi, '<div class="aurora-marquee-fallback">$1</div>');

  return migrated;
}

/**
 * Sanitizes an HTML string against an active policy
 */
export function sanitizeHtml(html: string, policy: RtePolicy = STANDARD_POLICIES.standard): string {
  if (policy.allowRawHtml && policy.allowScripts && policy.restrictedElements.length === 0) {
    return html; // Developer unrestricted mode
  }

  // First apply legacy migrations
  const preProcessed = migrateLegacyHtml(html);

  if (typeof DOMParser === 'undefined') {
    // SSR / Node fallback regex sanitization
    return preProcessed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(preProcessed, 'text/html');

  function sanitizeNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      const tag = elem.tagName.toLowerCase();

      // Check restricted elements
      if (policy.restrictedElements.map((r) => r.toLowerCase()).includes(tag)) {
        elem.remove();
        return;
      }

      // Check allowed elements list if configured
      if (policy.allowedElements.length > 0 && !policy.allowedElements.map((a) => a.toLowerCase()).includes(tag)) {
        // Unwrap node contents
        while (elem.firstChild) {
          elem.parentNode?.insertBefore(elem.firstChild, elem);
        }
        elem.remove();
        return;
      }

      // Sanitize attributes
      const attrNames = Array.from(elem.attributes).map((a) => a.name);
      for (const attrName of attrNames) {
        // Strip event handlers (onclick, onload, etc.)
        if (/^on/i.test(attrName)) {
          elem.removeAttribute(attrName);
          continue;
        }

        const attrVal = elem.getAttribute(attrName) || '';

        // Validate URLs for href, src, action
        if (['href', 'src', 'action'].includes(attrName.toLowerCase())) {
          if (!isValidUrl(attrVal, policy.allowedUrlProtocols)) {
            elem.removeAttribute(attrName);
            continue;
          }
        }
      }

      // Recursively sanitize children
      Array.from(elem.childNodes).forEach(sanitizeNode);
    }
  }

  Array.from(doc.body.childNodes).forEach(sanitizeNode);
  return doc.body.innerHTML;
}
