# Element Registry

The registry is the single source of truth for HTML capabilities.

## TypeScript model

```ts
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

export interface HtmlElementDefinition {
  tagName: string;
  displayName: string;
  description: string;
  aliases?: string[];

  category:
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

  capabilities: {
    editable: boolean;
    styleable: boolean;
    draggable: boolean;
    resizable: boolean;
    supportsChildren: boolean;
    supportsAttributes: boolean;
  };

  menu: {
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
  };

  security?: {
    requiresPermission: boolean;
    riskLevel: 'none' | 'low' | 'medium' | 'high';
  };
}

export interface AttributeDefinition {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'url' | 'enum' | 'token-list';
  required?: boolean;
  defaultValue?: unknown;
  allowedValues?: string[];
  description?: string;
}
```

## Registry services

```ts
interface HtmlElementRegistry {
  get(tagName: string): HtmlElementDefinition | undefined;
  getAll(): HtmlElementDefinition[];
  search(query: string): HtmlElementDefinition[];
  getByCategory(category: string): HtmlElementDefinition[];
  getAvailable(context: RteContext): HtmlElementDefinition[];
  register(definition: HtmlElementDefinition): void;
  unregister(tagName: string): void;
}
```

## Extensibility

Plugins may register:
- custom elements
- menu aliases
- templates
- configuration schemas
- validation rules
- serializers
- toolbar commands
