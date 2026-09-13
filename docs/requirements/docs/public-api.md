# Public API Contract

## Essential types

```ts
export interface AuroraDocument {
  format: 'aurora';
  version: number;
  content: AuroraNode[];
  meta?: Record<string, unknown>;
}

export interface EditorChange {
  document: AuroraDocument;
  patches: readonly JsonPatch[];
  origin: 'user' | 'command' | 'import' | 'api';
  transactionId: string;
}

export interface AuroraEditor {
  getDocument(): AuroraDocument;
  setDocument(document: AuroraDocument): void;
  execute(name: CommandName, input: unknown): CommandResult;
  export(input: ExportRequest): string;
  focus(options?: FocusOptions): void;
  on(event: EditorEventName, listener: EditorListener): Unsubscribe;
  destroy(): void;
}
```

## Rules

The host owns persistence, authorization, retention, identity, uploads, and retry. Change events expose debounced snapshots and structured patches. HTML uses a strict allow-list pipeline. Custom blocks use JSON validation and safe renderers. Network access occurs only through optional, host-supplied capability adapters: upload, mention search, link preview, embed policy, AI, comments, diagnostics, and clock.

## Compatibility

Breaking changes to JSON, public TypeScript types, custom-element attributes/events, Angular inputs/outputs, React props, or extension contracts require a major version. Support migrations for the two latest major document formats.

