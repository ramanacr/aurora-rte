# Context Validation and Insertion Engine

## Purpose

Prevent invalid HTML and provide context-aware suggestions.

## Context model

```ts
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
  editorMode: 'standard' | 'advanced' | 'developer' | 'email' | 'cms';
  policyId?: string;
}
```

## Availability result

```ts
export interface ElementAvailability {
  allowed: boolean;
  score: number;
  reason?: string;
  insertionStrategy: InsertionStrategy;
  suggestedAction?: 'insert' | 'transform' | 'configure' | 'inspect';
}
```

## Validation pipeline

1. Resolve current selection
2. Determine parent and ancestor chain
3. Load element definition
4. Check editor policy
5. Check allowed/disallowed parents
6. Check content model constraints
7. Select insertion strategy
8. Generate transaction
9. Normalize resulting DOM/model
10. Validate accessibility and security
11. Commit transaction

## Invalid insertion behavior

Prefer one of:
- prevent with explanation
- transform current selection
- close/split current block
- insert after current block
- insert as contextual child
- open configuration dialog

Example: inserting a section while inside a paragraph should split/close the paragraph and insert the section at block level.

## Suggested scoring

```ts
score =
  contextMatch * 50 +
  frequency * 20 +
  recentUsage * 15 +
  favoriteBoost * 10 +
  modeCompatibility * 5;
```
