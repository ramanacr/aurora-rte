import type {
  AccessibilityIssue,
  ElementInspectorData,
  HtmlElementDefinition
} from './types.js';
import { getGlobalRegistry } from './registry.js';

/**
 * Validates an HTMLElement against accessibility and authoring standards
 * returning detected issues categorized by severity with auto-fix metadata (Document 09)
 */
export function auditElementAccessibility(elem: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const tag = elem.tagName.toLowerCase();

  // 1. Image checks
  if (tag === 'img') {
    const alt = elem.getAttribute('alt');
    if (alt === null || alt === undefined) {
      issues.push({
        elementTag: 'img',
        severity: 'error',
        message: 'Image is missing an alt attribute. Provide alternative text or an empty alt="" for decorative images.',
        fixLabel: 'Add empty alt="" attribute',
        attributeToFix: 'alt',
        suggestedValue: ''
      });
    } else if (alt.trim().length === 0 && elem.getAttribute('role') !== 'presentation') {
      issues.push({
        elementTag: 'img',
        severity: 'info',
        message: 'Empty alt attribute marks this image as decorative.',
        fixLabel: 'Add descriptive alt text',
        attributeToFix: 'alt',
        suggestedValue: 'Descriptive text'
      });
    }
  }

  // 2. iFrame checks
  if (tag === 'iframe') {
    const title = elem.getAttribute('title');
    if (!title || title.trim().length === 0) {
      issues.push({
        elementTag: 'iframe',
        severity: 'error',
        message: '<iframe> elements require a title attribute describing their content for screen readers.',
        fixLabel: 'Add title="Embedded Content"',
        attributeToFix: 'title',
        suggestedValue: 'Embedded Content'
      });
    }
  }

  // 3. Button checks
  if (tag === 'button') {
    const text = elem.textContent?.trim() || '';
    const ariaLabel = elem.getAttribute('aria-label') || '';
    const ariaLabelledBy = elem.getAttribute('aria-labelledby') || '';

    if (!text && !ariaLabel && !ariaLabelledBy) {
      issues.push({
        elementTag: 'button',
        severity: 'error',
        message: 'Button does not have an accessible name (no text content or aria-label).',
        fixLabel: 'Set aria-label="Action"',
        attributeToFix: 'aria-label',
        suggestedValue: 'Action'
      });
    }
  }

  // 4. Form control checks
  if (['input', 'textarea', 'select'].includes(tag)) {
    const id = elem.getAttribute('id');
    const ariaLabel = elem.getAttribute('aria-label');
    const ariaLabelledBy = elem.getAttribute('aria-labelledby');
    let hasAssociatedLabel = false;

    if (id && elem.ownerDocument) {
      hasAssociatedLabel = !!elem.ownerDocument.querySelector(`label[for="${id}"]`);
    }

    if (!hasAssociatedLabel && !ariaLabel && !ariaLabelledBy) {
      issues.push({
        elementTag: tag,
        severity: 'warning',
        message: `Form control <${tag}> should have an associated <label> or aria-label attribute.`,
        fixLabel: 'Add aria-label="Field"',
        attributeToFix: 'aria-label',
        suggestedValue: 'Form Field'
      });
    }
  }

  // 5. Table checks
  if (tag === 'table') {
    const hasHeader = !!elem.querySelector('th');
    if (!hasHeader) {
      issues.push({
        elementTag: 'table',
        severity: 'warning',
        message: 'Data table does not contain any header cells (<th>). Header cells clarify row and column relationships.',
        fixLabel: 'Add Table Header',
        attributeToFix: 'header'
      });
    }
  }

  return issues;
}

/**
 * Extracts complete inspector data for a given DOM element
 */
export function inspectElement(elem: HTMLElement, registry = getGlobalRegistry()): ElementInspectorData {
  const tag = elem.tagName.toLowerCase();
  const definition: HtmlElementDefinition | undefined = registry.get(tag);

  const classes = Array.from(elem.classList);
  const styles: Record<string, string> = {};
  if (elem.style) {
    for (let i = 0; i < elem.style.length; i++) {
      const prop = elem.style[i];
      styles[prop] = elem.style.getPropertyValue(prop);
    }
  }

  const attributes: Record<string, string> = {};
  const dataAttributes: Record<string, string> = {};

  for (let i = 0; i < elem.attributes.length; i++) {
    const attr = elem.attributes[i];
    if (attr.name.startsWith('data-')) {
      dataAttributes[attr.name] = attr.value;
    } else if (!['id', 'class', 'style'].includes(attr.name)) {
      attributes[attr.name] = attr.value;
    }
  }

  const accessibilityIssues = auditElementAccessibility(elem);

  return {
    tagName: tag,
    id: elem.id || undefined,
    classes,
    styles,
    attributes,
    dataAttributes,
    htmlPreview: elem.outerHTML,
    accessibilityIssues,
    definition
  };
}

/**
 * Applies an accessibility auto-fix directly to an element
 */
export function applyAccessibilityFix(elem: HTMLElement, issue: AccessibilityIssue): boolean {
  if (issue.attributeToFix && issue.suggestedValue !== undefined) {
    elem.setAttribute(issue.attributeToFix, issue.suggestedValue);
    return true;
  }
  return false;
}
