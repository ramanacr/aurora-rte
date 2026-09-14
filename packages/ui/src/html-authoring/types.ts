/**
 * HTML Authoring System Type Definitions
 * Source of truth for HTML element taxonomy, registry, context validation,
 * insertion strategies, responsive layouts, accessibility, and security policies.
 */

export type InsertionStrategy =
  | 'inline'
  | 'block'
  | 'container'
  | 'composite'
  | 'contextual-child'
  | 'transform'
  | 'configuration'
  | 'restricted'
  | 'metadata';

export type ElementCategory =
  | 'basic'
  | 'text'
  | 'heading'
  | 'structure'
  | 'lists'
  | 'links'
  | 'media'
  | 'tables'
  | 'forms'
  | 'interactive'
  | 'data-code'
  | 'custom'
  | 'metadata'
  | 'restricted'
  | 'legacy';

export type EditorMode = 'standard' | 'advanced' | 'developer' | 'email' | 'cms';

export interface AttributeDefinition {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'url' | 'enum' | 'token-list';
  required?: boolean;
  defaultValue?: unknown;
  allowedValues?: string[];
  description?: string;
}

export interface HtmlElementCapabilities {
  editable: boolean;
  styleable: boolean;
  draggable: boolean;
  resizable: boolean;
  supportsChildren: boolean;
  supportsAttributes: boolean;
}

export interface HtmlElementMenuMetadata {
  visibleInStandard: boolean;
  visibleInAdvanced: boolean;
  preferredSurface:
    | 'toolbar'
    | 'insert-menu'
    | 'picker'
    | 'slash'
    | 'contextual'
    | 'inspector'
    | 'developer';
  priority: number;
}

export interface HtmlElementSecurity {
  requiresPermission: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface HtmlElementDefinition {
  tagName: string;
  displayName: string;
  description: string;
  aliases?: string[];
  category: ElementCategory;

  isVoid: boolean;
  isInline: boolean;
  isContainer: boolean;
  isComposite: boolean;

  insertionMode: InsertionStrategy;

  allowedParents?: string[];
  disallowedParents?: string[];
  allowedChildren?: string[];
  requiredChildren?: string[];

  attributes?: AttributeDefinition[];
  configurationSchema?: string;
  templateId?: string;

  capabilities: HtmlElementCapabilities;
  menu: HtmlElementMenuMetadata;
  security?: HtmlElementSecurity;
}

export interface RteContext {
  parentTag?: string;
  ancestorTags: string[];
  selectionType:
    | 'text'
    | 'inline'
    | 'block'
    | 'container'
    | 'table-cell'
    | 'list-item'
    | 'document-root';
  selectedNodeTags: string[];
  editorMode: EditorMode;
  policyId?: string;
}

export interface ElementAvailability {
  allowed: boolean;
  score: number;
  reason?: string;
  insertionStrategy: InsertionStrategy;
  suggestedAction?: 'insert' | 'transform' | 'configure' | 'inspect';
}

export interface TemplateNode {
  tag: string;
  text?: string;
  attributes?: Record<string, string>;
  children?: TemplateNode[];
}

export interface ElementTemplate {
  id: string;
  rootTag: string;
  displayName: string;
  requiredChildren?: string[];
  defaultChildren?: TemplateNode[];
  configurationSchema?: string;
  supportsNestedEditing: boolean;
}

export interface RtePolicy {
  allowedElements: string[];
  restrictedElements: string[];
  allowedAttributes: Record<string, string[]>;
  allowRawHtml: boolean;
  allowCustomElements: boolean;
  allowHeadEditing: boolean;
  allowScripts: boolean;
  allowedUrlProtocols: string[];
}

export interface AccessibilityIssue {
  elementTag: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixLabel?: string;
  attributeToFix?: string;
  suggestedValue?: string;
}

export interface ElementInspectorData {
  tagName: string;
  id?: string;
  classes: string[];
  styles: Record<string, string>;
  attributes: Record<string, string>;
  dataAttributes: Record<string, string>;
  htmlPreview: string;
  accessibilityIssues: AccessibilityIssue[];
  definition?: HtmlElementDefinition;
}

export type ResponsiveBreakpoint = 'expanded' | 'standard' | 'compact' | 'mobile' | 'minimal';

export interface ResponsiveCommandMetadata {
  id: string;
  priority: number;
  estimatedWidth: number;
  collapseGroup?: string;
  preferredSurface:
    | 'toolbar'
    | 'dropdown'
    | 'overflow'
    | 'bottom-sheet'
    | 'command-palette';
}

export interface UserPreferences {
  favorites: string[];
  recentElements: string[];
  customPriorities: Record<string, number>;
}
