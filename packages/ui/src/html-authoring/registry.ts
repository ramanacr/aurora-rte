import type {
  HtmlElementDefinition,
  ElementCategory,
  RteContext
} from './types.js';

export interface HtmlElementRegistry {
  get(tagName: string): HtmlElementDefinition | undefined;
  getAll(): HtmlElementDefinition[];
  search(query: string): HtmlElementDefinition[];
  getByCategory(category: ElementCategory | string): HtmlElementDefinition[];
  getAvailable(context: RteContext): HtmlElementDefinition[];
  register(definition: HtmlElementDefinition): void;
  unregister(tagName: string): void;
}

/**
 * Standard base capabilities helper
 */
function createCapabilities(opts: {
  editable?: boolean;
  styleable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  supportsChildren?: boolean;
  supportsAttributes?: boolean;
} = {}) {
  return {
    editable: opts.editable ?? true,
    styleable: opts.styleable ?? true,
    draggable: opts.draggable ?? true,
    resizable: opts.resizable ?? false,
    supportsChildren: opts.supportsChildren ?? true,
    supportsAttributes: opts.supportsAttributes ?? true
  };
}

/**
 * Built-in definitions according to Document 02 & 04
 */
export const BUILT_IN_ELEMENT_DEFINITIONS: HtmlElementDefinition[] = [
  // ================= 1. Document & Metadata =================
  {
    tagName: 'html',
    displayName: 'HTML Document',
    description: 'Root element of an HTML document',
    category: 'metadata',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'metadata',
    capabilities: createCapabilities({ draggable: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 10 }
  },
  {
    tagName: 'head',
    displayName: 'Document Head',
    description: 'Container for metadata and title',
    category: 'metadata',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'metadata',
    capabilities: createCapabilities({ draggable: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 11 }
  },
  {
    tagName: 'body',
    displayName: 'Document Body',
    description: 'Main body content container',
    category: 'metadata',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'metadata',
    capabilities: createCapabilities({ draggable: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 12 }
  },
  {
    tagName: 'title',
    displayName: 'Page Title',
    description: 'Document title metadata',
    category: 'metadata',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'metadata',
    capabilities: createCapabilities({ draggable: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'inspector', priority: 13 }
  },
  {
    tagName: 'meta',
    displayName: 'Meta Tag',
    description: 'Machine-readable metadata properties',
    category: 'metadata',
    isVoid: true,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'metadata',
    capabilities: createCapabilities({ supportsChildren: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'developer', priority: 14 }
  },
  {
    tagName: 'link',
    displayName: 'Link Metadata',
    description: 'Specifies relationships to external resources (stylesheets, icons)',
    category: 'metadata',
    isVoid: true,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'metadata',
    capabilities: createCapabilities({ supportsChildren: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'developer', priority: 15 }
  },
  {
    tagName: 'style',
    displayName: 'Style Block',
    description: 'Document CSS styles',
    category: 'restricted',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'restricted',
    capabilities: createCapabilities({ draggable: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 16 },
    security: { requiresPermission: true, riskLevel: 'medium' }
  },
  {
    tagName: 'script',
    displayName: 'Script',
    description: 'Executable client script',
    category: 'restricted',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'restricted',
    capabilities: createCapabilities({ draggable: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 17 },
    security: { requiresPermission: true, riskLevel: 'high' }
  },
  {
    tagName: 'template',
    displayName: 'Template Fragment',
    description: 'Inert client-side template element for Web Components',
    category: 'custom',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'developer', priority: 18 }
  },
  {
    tagName: 'slot',
    displayName: 'Web Component Slot',
    description: 'Content placeholder within a Web Component template',
    category: 'custom',
    isVoid: false,
    isInline: true,
    isContainer: true,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'developer', priority: 19 }
  },

  // ================= 2. Text & Inline Semantics =================
  {
    tagName: 'p',
    displayName: 'Paragraph',
    description: 'Standard text block paragraph',
    aliases: ['text', 'para'],
    category: 'basic',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 1 }
  },
  {
    tagName: 'span',
    displayName: 'Inline Span',
    description: 'Generic inline text container for styling',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 20 }
  },
  {
    tagName: 'strong',
    displayName: 'Strong Importance',
    description: 'Indicates strong importance or urgency (bold)',
    aliases: ['bold', 'important'],
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 2 }
  },
  {
    tagName: 'em',
    displayName: 'Emphasis',
    description: 'Indicates stress emphasis (italic)',
    aliases: ['italic', 'emphasis'],
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 3 }
  },
  {
    tagName: 'u',
    displayName: 'Underline',
    description: 'Unarticulated non-textual annotation',
    aliases: ['underline'],
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 4 }
  },
  {
    tagName: 's',
    displayName: 'Strikethrough',
    description: 'Content that is no longer accurate or relevant',
    aliases: ['strike', 'del'],
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 5 }
  },
  {
    tagName: 'mark',
    displayName: 'Highlighted Mark',
    description: 'Text marked or highlighted for reference purposes',
    aliases: ['highlight'],
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 6 }
  },
  {
    tagName: 'small',
    displayName: 'Side Comment (Small)',
    description: 'Side comments, legal disclaimer, or fine print',
    aliases: ['fineprint'],
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 21 }
  },
  {
    tagName: 'del',
    displayName: 'Deleted Text',
    description: 'Represents removed text in document revision tracking',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 22 }
  },
  {
    tagName: 'ins',
    displayName: 'Inserted Text',
    description: 'Represents added text in document revision tracking',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 23 }
  },
  {
    tagName: 'sub',
    displayName: 'Subscript',
    description: 'Subscript characters (e.g. chemical formulas)',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 7 }
  },
  {
    tagName: 'sup',
    displayName: 'Superscript',
    description: 'Superscript characters (e.g. exponents, footnotes)',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 8 }
  },
  {
    tagName: 'br',
    displayName: 'Line Break',
    description: 'Forced carriage return line break',
    category: 'text',
    isVoid: true,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities({ supportsChildren: false }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 24 }
  },
  {
    tagName: 'wbr',
    displayName: 'Word Break Opportunity',
    description: 'Suggested position for word break if needed',
    category: 'text',
    isVoid: true,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities({ supportsChildren: false }),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'picker', priority: 25 }
  },
  {
    tagName: 'abbr',
    displayName: 'Abbreviation',
    description: 'Abbreviation or acronym with optional expansion title',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    attributes: [{ name: 'title', type: 'string', description: 'Full expanded form' }],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 26 }
  },
  {
    tagName: 'cite',
    displayName: 'Citation',
    description: 'Reference to a creative work, book, article, or paper',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 27 }
  },
  {
    tagName: 'q',
    displayName: 'Inline Quote',
    description: 'Short inline quote with automatic quotation marks',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 28 }
  },
  {
    tagName: 'time',
    displayName: 'Date / Time',
    description: 'Machine-readable date, timestamp, or duration',
    category: 'text',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    attributes: [{ name: 'datetime', type: 'string', description: 'ISO 8601 date/time string' }],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 29 }
  },
  {
    tagName: 'kbd',
    displayName: 'Keyboard Input',
    description: 'User keyboard input indicator (e.g. Ctrl+C)',
    category: 'data-code',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 30 }
  },
  {
    tagName: 'code',
    displayName: 'Inline Code',
    description: 'Inline computer code fragment',
    category: 'data-code',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 9 }
  },
  {
    tagName: 'samp',
    displayName: 'Sample Output',
    description: 'Sample output from a computer program',
    category: 'data-code',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'picker', priority: 31 }
  },
  {
    tagName: 'var',
    displayName: 'Variable',
    description: 'Mathematical or programming variable',
    category: 'data-code',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'picker', priority: 32 }
  },

  // ================= 3. Headings =================
  {
    tagName: 'h1',
    displayName: 'Heading 1',
    description: 'Top-level document section heading',
    aliases: ['title', 'h1'],
    category: 'heading',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 1 }
  },
  {
    tagName: 'h2',
    displayName: 'Heading 2',
    description: 'Major section heading',
    aliases: ['h2'],
    category: 'heading',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 2 }
  },
  {
    tagName: 'h3',
    displayName: 'Heading 3',
    description: 'Subsection heading',
    aliases: ['h3'],
    category: 'heading',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 3 }
  },
  {
    tagName: 'h4',
    displayName: 'Heading 4',
    description: 'Fourth-level subsection heading',
    aliases: ['h4'],
    category: 'heading',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 4 }
  },
  {
    tagName: 'h5',
    displayName: 'Heading 5',
    description: 'Fifth-level heading',
    aliases: ['h5'],
    category: 'heading',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 5 }
  },
  {
    tagName: 'h6',
    displayName: 'Heading 6',
    description: 'Sixth-level heading',
    aliases: ['h6'],
    category: 'heading',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 6 }
  },

  // ================= 4. Structure =================
  {
    tagName: 'div',
    displayName: 'Container (Div)',
    description: 'Generic structural block container',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 40 }
  },
  {
    tagName: 'section',
    displayName: 'Section',
    description: 'Thematic grouping of content, typically with a heading',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'section-template',
    insertionMode: 'composite',
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 41 }
  },
  {
    tagName: 'article',
    displayName: 'Article',
    description: 'Self-contained, independently distributable composition',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'article-template',
    insertionMode: 'composite',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 42 }
  },
  {
    tagName: 'header',
    displayName: 'Header',
    description: 'Introductory content or navigational aids for a section',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 43 }
  },
  {
    tagName: 'footer',
    displayName: 'Footer',
    description: 'Footer content for a section or document',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 44 }
  },
  {
    tagName: 'main',
    displayName: 'Main Content',
    description: 'Dominant content of the document body',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 45 }
  },
  {
    tagName: 'nav',
    displayName: 'Navigation',
    description: 'Section of navigational links',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 46 }
  },
  {
    tagName: 'aside',
    displayName: 'Aside / Sidebar',
    description: 'Content tangentially related to surrounding content',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 47 }
  },
  {
    tagName: 'address',
    displayName: 'Contact Address',
    description: 'Contact information for author or organization',
    category: 'structure',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'picker', priority: 48 }
  },
  {
    tagName: 'hr',
    displayName: 'Horizontal Rule',
    description: 'Thematic break or divider between paragraphs',
    aliases: ['divider', 'separator'],
    category: 'basic',
    isVoid: true,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities({ supportsChildren: false }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 10 }
  },

  // ================= 5. Lists =================
  {
    tagName: 'ul',
    displayName: 'Bulleted List',
    description: 'Unordered list of items',
    aliases: ['bullets'],
    category: 'lists',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'ul-template',
    insertionMode: 'composite',
    requiredChildren: ['li'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 1 }
  },
  {
    tagName: 'ol',
    displayName: 'Numbered List',
    description: 'Ordered list of numbered items',
    aliases: ['numbers'],
    category: 'lists',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'ol-template',
    insertionMode: 'composite',
    requiredChildren: ['li'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 2 }
  },
  {
    tagName: 'li',
    displayName: 'List Item',
    description: 'Individual item within an ordered or unordered list',
    category: 'lists',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['ul', 'ol', 'menu'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 50 }
  },
  {
    tagName: 'dl',
    displayName: 'Description List',
    description: 'List of name-value pairs (terms and descriptions)',
    category: 'lists',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'dl-template',
    insertionMode: 'composite',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 3 }
  },
  {
    tagName: 'dt',
    displayName: 'Definition Term',
    description: 'Term or name in a description list',
    category: 'lists',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['dl'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 51 }
  },
  {
    tagName: 'dd',
    displayName: 'Definition Description',
    description: 'Description or value in a description list',
    category: 'lists',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['dl'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 52 }
  },

  // ================= 6. Quotes & Code =================
  {
    tagName: 'blockquote',
    displayName: 'Blockquote',
    description: 'Extended quotation from another source',
    aliases: ['quote'],
    category: 'basic',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 11 }
  },
  {
    tagName: 'pre',
    displayName: 'Preformatted Code Block',
    description: 'Preformatted text block preserving whitespace and code layout',
    aliases: ['codeblock'],
    category: 'data-code',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'block',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 12 }
  },

  // ================= 7. Links =================
  {
    tagName: 'a',
    displayName: 'Hyperlink',
    description: 'Hypertext link to a web address or anchor',
    aliases: ['link', 'url'],
    category: 'links',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'inline',
    attributes: [
      { name: 'href', type: 'url', required: true, description: 'Destination URL' },
      { name: 'target', type: 'enum', allowedValues: ['_blank', '_self', '_parent', '_top'] },
      { name: 'title', type: 'string', description: 'Advisory title' }
    ],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 13 }
  },

  // ================= 8. Media =================
  {
    tagName: 'img',
    displayName: 'Image',
    description: 'Visual image embed',
    aliases: ['picture', 'photo'],
    category: 'media',
    isVoid: true,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'src', type: 'url', required: true, description: 'Image URL' },
      { name: 'alt', type: 'string', required: true, description: 'Alternative accessible text' },
      { name: 'width', type: 'string' },
      { name: 'height', type: 'string' }
    ],
    capabilities: createCapabilities({ resizable: true, supportsChildren: false }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 14 }
  },
  {
    tagName: 'figure',
    displayName: 'Figure with Caption',
    description: 'Self-contained visual content with an optional caption',
    category: 'media',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'figure-template',
    insertionMode: 'composite',
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 60 }
  },
  {
    tagName: 'figcaption',
    displayName: 'Figure Caption',
    description: 'Caption or legend for a figure',
    category: 'media',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['figure'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 61 }
  },
  {
    tagName: 'video',
    displayName: 'Video Player',
    description: 'Embedded media video player',
    category: 'media',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'src', type: 'url', description: 'Video media source' },
      { name: 'controls', type: 'boolean', defaultValue: true },
      { name: 'autoplay', type: 'boolean' }
    ],
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 62 }
  },
  {
    tagName: 'audio',
    displayName: 'Audio Player',
    description: 'Embedded sound and audio clip player',
    category: 'media',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'src', type: 'url', description: 'Audio media source' },
      { name: 'controls', type: 'boolean', defaultValue: true }
    ],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 63 }
  },
  {
    tagName: 'iframe',
    displayName: 'Embedded Frame (iFrame)',
    description: 'Nested browsing context for embedding external content',
    category: 'media',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'src', type: 'url', required: true },
      { name: 'title', type: 'string', required: true, description: 'Accessible frame description' },
      { name: 'width', type: 'string' },
      { name: 'height', type: 'string' }
    ],
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 64 },
    security: { requiresPermission: true, riskLevel: 'medium' }
  },

  // ================= 9. Tables =================
  {
    tagName: 'table',
    displayName: 'Data Table',
    description: 'Tabular data arranged in rows and columns',
    category: 'tables',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'table-template',
    insertionMode: 'composite',
    requiredChildren: ['tr'],
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'toolbar', priority: 15 }
  },
  {
    tagName: 'tr',
    displayName: 'Table Row',
    description: 'Horizontal row of cells inside a table',
    category: 'tables',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['table', 'thead', 'tbody', 'tfoot'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 70 }
  },
  {
    tagName: 'th',
    displayName: 'Table Header Cell',
    description: 'Header cell for a table column or row',
    category: 'tables',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['tr'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 71 }
  },
  {
    tagName: 'td',
    displayName: 'Table Data Cell',
    description: 'Standard data cell inside a table row',
    category: 'tables',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['tr'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 72 }
  },

  // ================= 10. Forms =================
  {
    tagName: 'form',
    displayName: 'Form Container',
    description: 'Interactive controls collection for submitting information',
    category: 'forms',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'container',
    attributes: [
      { name: 'action', type: 'url' },
      { name: 'method', type: 'enum', allowedValues: ['get', 'post', 'dialog'] }
    ],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 80 }
  },
  {
    tagName: 'input',
    displayName: 'Input Field',
    description: 'Interactive typed data entry control',
    category: 'forms',
    isVoid: true,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'type', type: 'enum', allowedValues: ['text', 'number', 'email', 'password', 'checkbox', 'radio', 'date', 'file', 'hidden'], defaultValue: 'text' },
      { name: 'name', type: 'string' },
      { name: 'placeholder', type: 'string' },
      { name: 'required', type: 'boolean' }
    ],
    capabilities: createCapabilities({ supportsChildren: false }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 81 }
  },
  {
    tagName: 'textarea',
    displayName: 'Multiline Text Area',
    description: 'Multiline plain-text editing control',
    category: 'forms',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'rows', type: 'number', defaultValue: 4 },
      { name: 'cols', type: 'number', defaultValue: 40 },
      { name: 'placeholder', type: 'string' }
    ],
    capabilities: createCapabilities({ resizable: true }),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 82 }
  },
  {
    tagName: 'button',
    displayName: 'Button',
    description: 'Clickable command button',
    category: 'forms',
    isVoid: false,
    isInline: true,
    isContainer: true,
    isComposite: false,
    insertionMode: 'inline',
    attributes: [
      { name: 'type', type: 'enum', allowedValues: ['button', 'submit', 'reset'], defaultValue: 'button' }
    ],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 83 }
  },
  {
    tagName: 'label',
    displayName: 'Form Label',
    description: 'Accessible caption for a user interface item',
    category: 'forms',
    isVoid: false,
    isInline: true,
    isContainer: true,
    isComposite: false,
    insertionMode: 'inline',
    attributes: [{ name: 'for', type: 'string', description: 'Target control ID' }],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 84 }
  },
  {
    tagName: 'select',
    displayName: 'Dropdown Select',
    description: 'Menu of selectable options',
    category: 'forms',
    isVoid: false,
    isInline: true,
    isContainer: true,
    isComposite: true,
    templateId: 'select-template',
    insertionMode: 'composite',
    requiredChildren: ['option'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 85 }
  },
  {
    tagName: 'option',
    displayName: 'Select Option',
    description: 'Individual option item in a select menu',
    category: 'forms',
    isVoid: false,
    isInline: false,
    isContainer: false,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['select', 'optgroup', 'datalist'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 86 }
  },
  {
    tagName: 'progress',
    displayName: 'Progress Bar',
    description: 'Completion progress indicator of a task',
    category: 'forms',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'value', type: 'number', defaultValue: 50 },
      { name: 'max', type: 'number', defaultValue: 100 }
    ],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 87 }
  },
  {
    tagName: 'meter',
    displayName: 'Gauge Meter',
    description: 'Scalar measurement within a known range',
    category: 'forms',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'configuration',
    attributes: [
      { name: 'value', type: 'number', defaultValue: 60 },
      { name: 'min', type: 'number', defaultValue: 0 },
      { name: 'max', type: 'number', defaultValue: 100 }
    ],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 88 }
  },

  // ================= 11. Interactive =================
  {
    tagName: 'details',
    displayName: 'Details Accordion',
    description: 'Disclosure widget with expandable details content',
    aliases: ['accordion', 'collapsible'],
    category: 'interactive',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'details-template',
    insertionMode: 'composite',
    requiredChildren: ['summary'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 90 }
  },
  {
    tagName: 'summary',
    displayName: 'Details Summary',
    description: 'Heading label for a details disclosure element',
    category: 'interactive',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'contextual-child',
    allowedParents: ['details'],
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'contextual', priority: 91 }
  },
  {
    tagName: 'dialog',
    displayName: 'Modal Dialog',
    description: 'Interactive popup or modal dialog box',
    aliases: ['modal', 'popup'],
    category: 'interactive',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: true,
    templateId: 'dialog-template',
    insertionMode: 'composite',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 92 }
  },

  // ================= 12. Legacy =================
  {
    tagName: 'font',
    displayName: 'Legacy Font',
    description: 'Deprecated font styling tag (migrates to span)',
    category: 'legacy',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'restricted',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 99 }
  },
  {
    tagName: 'center',
    displayName: 'Legacy Center',
    description: 'Deprecated center alignment tag (migrates to container style)',
    category: 'legacy',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'restricted',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 99 }
  },
  {
    tagName: 'strike',
    displayName: 'Legacy Strike',
    description: 'Deprecated strike element (migrates to s)',
    category: 'legacy',
    isVoid: false,
    isInline: true,
    isContainer: false,
    isComposite: false,
    insertionMode: 'restricted',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 99 }
  },
  {
    tagName: 'marquee',
    displayName: 'Legacy Marquee',
    description: 'Deprecated scrolling text marquee (not recommended)',
    category: 'legacy',
    isVoid: false,
    isInline: false,
    isContainer: true,
    isComposite: false,
    insertionMode: 'restricted',
    capabilities: createCapabilities(),
    menu: { visibleInStandard: false, visibleInAdvanced: false, preferredSurface: 'developer', priority: 99 }
  }
];

/**
 * Single source of truth registry implementation
 */
export class DefaultHtmlElementRegistry implements HtmlElementRegistry {
  private definitions = new Map<string, HtmlElementDefinition>();

  constructor(initialDefinitions: HtmlElementDefinition[] = BUILT_IN_ELEMENT_DEFINITIONS) {
    for (const def of initialDefinitions) {
      this.definitions.set(def.tagName.toLowerCase(), def);
    }
  }

  get(tagName: string): HtmlElementDefinition | undefined {
    return this.definitions.get(tagName.toLowerCase());
  }

  getAll(): HtmlElementDefinition[] {
    return Array.from(this.definitions.values());
  }

  search(query: string): HtmlElementDefinition[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    return this.getAll()
      .filter((def) => {
        if (def.tagName.toLowerCase().includes(q)) return true;
        if (def.displayName.toLowerCase().includes(q)) return true;
        if (def.description.toLowerCase().includes(q)) return true;
        if (def.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
        if (def.category.toLowerCase().includes(q)) return true;
        return false;
      })
      .sort((a, b) => {
        // Exact tag name match has top priority
        const aExact = a.tagName.toLowerCase() === q;
        const bExact = b.tagName.toLowerCase() === q;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Tag name startsWith
        const aStarts = a.tagName.toLowerCase().startsWith(q);
        const bStarts = b.tagName.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.menu.priority - b.menu.priority;
      });
  }

  getByCategory(category: ElementCategory | string): HtmlElementDefinition[] {
    return this.getAll()
      .filter((def) => def.category === category)
      .sort((a, b) => a.menu.priority - b.menu.priority);
  }

  getAvailable(context: RteContext): HtmlElementDefinition[] {
    return this.getAll().filter((def) => {
      // Check mode visibility
      if (context.editorMode === 'standard' && !def.menu.visibleInStandard) {
        return false;
      }
      if (context.editorMode === 'advanced' && !def.menu.visibleInAdvanced && !def.menu.visibleInStandard) {
        return false;
      }

      // Check disallowed parents
      if (context.parentTag && def.disallowedParents?.includes(context.parentTag.toLowerCase())) {
        return false;
      }

      // Check required parent constraints for contextual children
      if (def.allowedParents && def.allowedParents.length > 0) {
        if (!context.parentTag || !def.allowedParents.includes(context.parentTag.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  register(definition: HtmlElementDefinition): void {
    this.definitions.set(definition.tagName.toLowerCase(), definition);
  }

  unregister(tagName: string): void {
    this.definitions.delete(tagName.toLowerCase());
  }
}

// Global registry instance
let globalRegistry: HtmlElementRegistry | null = null;

export function getGlobalRegistry(): HtmlElementRegistry {
  if (!globalRegistry) {
    globalRegistry = new DefaultHtmlElementRegistry();
  }
  return globalRegistry;
}

export function createDefaultRegistry(): HtmlElementRegistry {
  return new DefaultHtmlElementRegistry();
}
