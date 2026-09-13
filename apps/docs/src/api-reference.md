# Aurora Editor API Reference

Comprehensive reference for the stable public facade and contracts.

## `createEditor(options: EditorOptions): AuroraEditor`

Creates an isolated editor instance.

### Parameters (`EditorOptions`)

- `document?: AuroraDocument`: Initial JSON document. Defaults to single paragraph.
- `element?: HTMLElement | null`: DOM element to mount the editor into.
- `upload?: HostUploadAdapter`: Host-supplied file upload adapter.
- `features?: unknown[]`: List of feature plugins.
- `theme?: { preset?: string; tokens?: Record<string, string> }`: Custom theme styling.

### Methods (`AuroraEditor`)

- `getDocument(): AuroraDocument`: Returns the current immutable Aurora JSON document.
- `setDocument(doc: AuroraDocument): void`: Sets a new document after schema validation.
- `execute(name: CommandName | string, input?: unknown): CommandResult`: Dispatches a typed command.
- `export(request: ExportRequest): string`: Serializes current document to `html`, `markdown`, `json`, or `text`.
- `focus(options?: FocusOptions): void`: Focuses the editor surface.
- `on(event: EditorEventName, listener: EditorListener): Unsubscribe`: Subscribes to events (`change`, `selectionChange`, `error`, `focus`, `blur`).
- `destroy(): void`: Tears down editor and unsubscribes all event handlers.
