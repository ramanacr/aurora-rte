import type { ElementTemplate, TemplateNode } from './types.js';

/**
 * Built-in composite templates ensuring structured scaffolds are auto-generated
 * rather than empty tags (Document 06)
 */
export const BUILT_IN_COMPOSITE_TEMPLATES: Record<string, ElementTemplate> = {
  'section-template': {
    id: 'section-template',
    rootTag: 'section',
    displayName: 'Thematic Section',
    requiredChildren: ['h2', 'p'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'h2', text: 'Section Heading' },
      { tag: 'p', text: 'Start writing your section content here...' }
    ]
  },
  'article-template': {
    id: 'article-template',
    rootTag: 'article',
    displayName: 'Independent Article',
    requiredChildren: ['header', 'p'],
    supportsNestedEditing: true,
    defaultChildren: [
      {
        tag: 'header',
        children: [
          { tag: 'h1', text: 'Article Title' },
          { tag: 'p', attributes: { class: 'article-subtitle' }, text: 'Published date and author' }
        ]
      },
      { tag: 'p', text: 'Article body paragraphs...' }
    ]
  },
  'details-template': {
    id: 'details-template',
    rootTag: 'details',
    displayName: 'Collapsible Details Accordion',
    requiredChildren: ['summary'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'summary', text: 'Click to expand details' },
      { tag: 'p', text: 'Expanded details content goes here...' }
    ]
  },
  'figure-template': {
    id: 'figure-template',
    rootTag: 'figure',
    displayName: 'Figure with Caption',
    requiredChildren: ['img', 'figcaption'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'img', attributes: { src: 'https://placehold.co/600x400', alt: 'Sample figure image' } },
      { tag: 'figcaption', text: 'Caption describing the figure above' }
    ]
  },
  'form-field-template': {
    id: 'form-field-template',
    rootTag: 'div',
    displayName: 'Form Field Group',
    requiredChildren: ['label', 'input'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'label', attributes: { for: 'form-input-field' }, text: 'Input Label' },
      { tag: 'input', attributes: { id: 'form-input-field', type: 'text', placeholder: 'Enter value...' } }
    ]
  },
  'select-template': {
    id: 'select-template',
    rootTag: 'select',
    displayName: 'Select Option Dropdown',
    requiredChildren: ['option'],
    supportsNestedEditing: false,
    defaultChildren: [
      { tag: 'option', attributes: { value: 'option1' }, text: 'Option 1' },
      { tag: 'option', attributes: { value: 'option2' }, text: 'Option 2' },
      { tag: 'option', attributes: { value: 'option3' }, text: 'Option 3' }
    ]
  },
  'dialog-template': {
    id: 'dialog-template',
    rootTag: 'dialog',
    displayName: 'Interactive Modal Dialog',
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'h3', text: 'Dialog Title' },
      { tag: 'p', text: 'Modal dialog content goes here.' },
      { tag: 'button', attributes: { type: 'button' }, text: 'Close' }
    ]
  },
  'dl-template': {
    id: 'dl-template',
    rootTag: 'dl',
    displayName: 'Description List',
    requiredChildren: ['dt', 'dd'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'dt', text: 'Term 1' },
      { tag: 'dd', text: 'Definition and details for term 1.' },
      { tag: 'dt', text: 'Term 2' },
      { tag: 'dd', text: 'Definition and details for term 2.' }
    ]
  },
  'ul-template': {
    id: 'ul-template',
    rootTag: 'ul',
    displayName: 'Bulleted List',
    requiredChildren: ['li'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'li', text: 'First item' },
      { tag: 'li', text: 'Second item' },
      { tag: 'li', text: 'Third item' }
    ]
  },
  'ol-template': {
    id: 'ol-template',
    rootTag: 'ol',
    displayName: 'Numbered List',
    requiredChildren: ['li'],
    supportsNestedEditing: true,
    defaultChildren: [
      { tag: 'li', text: 'First step' },
      { tag: 'li', text: 'Second step' },
      { tag: 'li', text: 'Third step' }
    ]
  },
  'table-template': {
    id: 'table-template',
    rootTag: 'table',
    displayName: '3x3 Table',
    requiredChildren: ['tr'],
    supportsNestedEditing: true,
    defaultChildren: [
      {
        tag: 'thead',
        children: [
          {
            tag: 'tr',
            children: [
              { tag: 'th', text: 'Header 1' },
              { tag: 'th', text: 'Header 2' },
              { tag: 'th', text: 'Header 3' }
            ]
          }
        ]
      },
      {
        tag: 'tbody',
        children: [
          {
            tag: 'tr',
            children: [
              { tag: 'td', text: 'Row 1, Cell 1' },
              { tag: 'td', text: 'Row 1, Cell 2' },
              { tag: 'td', text: 'Row 1, Cell 3' }
            ]
          },
          {
            tag: 'tr',
            children: [
              { tag: 'td', text: 'Row 2, Cell 1' },
              { tag: 'td', text: 'Row 2, Cell 2' },
              { tag: 'td', text: 'Row 2, Cell 3' }
            ]
          }
        ]
      }
    ]
  }
};

/**
 * Renders a TemplateNode tree into an HTML string
 */
function renderNodeToHtml(node: TemplateNode): string {
  const attrs = node.attributes
    ? ' ' + Object.entries(node.attributes).map(([k, v]) => `${k}="${v}"`).join(' ')
    : '';

  const voidTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
  if (voidTags.includes(node.tag.toLowerCase())) {
    return `<${node.tag}${attrs}>`;
  }

  let inner = node.text || '';
  if (node.children && node.children.length > 0) {
    inner += node.children.map(renderNodeToHtml).join('');
  }

  return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

/**
 * Renders an ElementTemplate into a valid HTML string scaffold
 */
export function renderTemplateToHtml(template: ElementTemplate, customAttrs?: Record<string, string>): string {
  const attrs = customAttrs
    ? ' ' + Object.entries(customAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')
    : '';

  let inner = '';
  if (template.defaultChildren) {
    inner = template.defaultChildren.map(renderNodeToHtml).join('');
  }

  return `<${template.rootTag}${attrs}>${inner}</${template.rootTag}>`;
}
