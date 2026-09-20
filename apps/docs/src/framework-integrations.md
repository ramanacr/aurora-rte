# Aurora Editor — Angular & React Integration Guide

This guide covers everything you need to integrate the Aurora Rich-Text Editor into an **Angular 17+** or **React 19** application: when to use each package, available inputs/props, outputs/callbacks, exposed events, imperative APIs, DI tokens, hooks, and worked examples.

---

## Table of Contents

1. [Package Overview](#package-overview)
2. [Angular Integration (`@aurora/angular`)](#angular-integration)
   - [When to Use](#angular-when-to-use)
   - [`<aurora-editor>` Inputs](#aurora-editor-inputs)
   - [`<aurora-editor>` Outputs (Events)](#aurora-editor-outputs-events)
   - [Imperative API (Component Methods)](#angular-imperative-api)
   - [DI Tokens](#di-tokens)
   - [`HtmlAuthoringService` API](#htmlauthoringservice-api)
   - [`AuroraThemeService` API](#aurorathemeservice-api)
   - [Angular Usage Examples](#angular-usage-examples)
3. [React Integration (`@aurora/react`)](#react-integration)
   - [When to Use](#react-when-to-use)
   - [`<AuroraEditor>` Props](#auroraeditor-props)
   - [Ref API (`AuroraEditorRef`)](#ref-api-auroraeditorref)
   - [`AuroraProvider` & Context](#auroraprovider--context)
   - [React Hooks](#react-hooks)
   - [React Usage Examples](#react-usage-examples)
4. [Shared Editor Events](#shared-editor-events)
   - [`change`](#change-event)
   - [`selectionChange`](#selectionchange-event)
   - [`focus` / `blur` / `destroy`](#focus--blur--destroy-events)
   - [`error`](#error-event)
5. [Shared Command Reference](#shared-command-reference)
6. [Theme System](#theme-system)

---

## Package Overview

| Package | Framework | Component/API | Lazy Init? |
|---|---|---|---|
| `@aurora/angular` | Angular 17+ Standalone | `<aurora-editor>` | ✅ One-time on `tab-angular` click |
| `@aurora/react` | React 19 | `<AuroraEditor>` | ✅ One-time on `tab-react` click |

Both packages wrap the same underlying `@aurora/editor` core and share the same event types, command names, and document model (`AuroraDocument` from `@aurora/model`).

---

## Angular Integration

### Angular: When to Use

Use `@aurora/angular` when:

- Your host application is built with **Angular 17+** and uses standalone components.
- You need **reactive forms** support (`ngModel` / `FormControl`) — the component implements `ControlValueAccessor` out of the box.
- You want to inject a **custom element registry** or **content policy** via Angular DI (`HTML_ELEMENT_REGISTRY`, `RTE_POLICY`).
- You need signal-based theme state via `AuroraThemeService`.

### `<aurora-editor>` Inputs

```html
<aurora-editor
  [document]="myDoc"
  [toolbar]="true"
  [legacyToolbar]="false"
  [mode]="'standard'"
  [enableMobileActions]="false"
  [upload]="myUploadAdapter"
  [theme]="'aurora-dark'"
  [tokens]="myTokens"
  [autoInherit]="true"
  (docChange)="onDocChange($event)"
  (selectionChange)="onSelection($event)"
  (editorReady)="onReady($event)"
/>
```

| Input | Type | Default | Description |
|---|---|---|---|
| `document` | `AuroraDocument \| undefined` | `undefined` | Initial JSON document to load. If omitted, an empty paragraph is created. |
| `toolbar` | `boolean` | `true` | Show the built-in toolbar. Set `false` to render a completely toolbarless editor. |
| `legacyToolbar` | `boolean` | `false` | When `true`, mounts the toolbar using the non-Angular `createToolbar()` factory (for environments that cannot use the Angular standalone toolbar). When `false` (default), renders `<aurora-rte-toolbar>`. |
| `mode` | `'standard' \| 'html' \| 'readonly'` | `'standard'` | Editor interaction mode. `'html'` enables the HTML Element Picker and advanced authoring widgets. `'readonly'` disables all editing. |
| `enableMobileActions` | `boolean` | `false` | Show the bottom mobile action drawer for touch-friendly formatting on small screens. |
| `upload` | `HostUploadAdapter \| undefined` | `undefined` | Host-provided file/image upload adapter. See `@aurora/editor` for the `HostUploadAdapter` interface. |
| `features` | `unknown[] \| undefined` | `undefined` | Optional list of feature plugins to enable. |
| `theme` | `string` | `'auto'` | Theme preset name (`'aurora-dark'`, `'aurora-light'`, `'shadcn-dark'`, etc.) or `'auto'` to inherit from the host page. |
| `tokens` | `Partial<ThemeTokens> \| undefined` | `undefined` | Override individual CSS design tokens. Merged on top of the active theme. |
| `autoInherit` | `boolean` | `true` | When `true`, the editor inherits CSS custom properties already set on the host page. Disable when you want strict theme isolation. |

### `<aurora-editor>` Outputs (Events)

| Output | Payload Type | Emitted When |
|---|---|---|
| `(docChange)` | `EditorChange` | Every time the document content changes (user typing, commands, paste, API calls). |
| `(selectionChange)` | `SelectionState` | Every time the user's cursor/selection moves or the active marks change. |
| `(editorReady)` | `AuroraEditor` | Once after the underlying core editor is created (`ngOnInit`). Use this to get a direct reference for advanced event subscriptions (`focus`, `blur`, `error`, `destroy`). |

> **Note:** `focus` and `blur` are not emitted as `@Output()` directly. To listen to them, use the `AuroraEditor` instance from `(editorReady)` and call `editor.on('focus', ...)` / `editor.on('blur', ...)`.

### Angular Imperative API

After obtaining a component reference via `@ViewChild`, you can call these methods directly:

```typescript
@ViewChild(AuroraEditorComponent) editorComp!: AuroraEditorComponent;

// Read current document as AuroraDocument JSON
const doc = this.editorComp.getDocument();

// Replace the full document
this.editorComp.setDocument(newDoc);

// Run a built-in command
this.editorComp.execute('insertTable', { rows: 3, columns: 3, header: true });
this.editorComp.execute('toggleBold');

// Export as HTML, Markdown, JSON, or plain text
const html = this.editorComp.export({ format: 'html' });

// Programmatically focus the editor
this.editorComp.focus();

// Open the HTML Element Picker dialog
this.editorComp.openElementPicker();

// Open the Command Palette (Ctrl+K)
this.editorComp.openCommandPalette();

// Trigger the Element Inspector on a specific DOM element
this.editorComp.inspectElement(someHTMLElement);
```

| Method | Signature | Description |
|---|---|---|
| `getDocument()` | `() => AuroraDocument \| undefined` | Returns the current document. |
| `setDocument(doc)` | `(doc: AuroraDocument) => void` | Replaces the editor content with `doc`. |
| `execute(name, input?)` | `(name: CommandName \| string, input?: unknown) => CommandResult \| undefined` | Dispatches a command by name with optional payload. |
| `export(request)` | `(request: ExportRequest) => string` | Serializes the document. `request.format` must be `'html'`, `'markdown'`, `'json'`, or `'text'`. |
| `focus()` | `() => void` | Focuses the editor surface. |
| `openElementPicker()` | `() => void` | Programmatically opens the HTML Element Picker dialog. |
| `openCommandPalette()` | `() => void` | Programmatically opens the Command Palette. |
| `inspectElement(el)` | `(element: HTMLElement) => void` | Opens the Element Inspector panel for the given DOM element. |

The component also exposes the raw `editor: AuroraEditor | null` public property for direct access to the underlying core API.

### DI Tokens

`@aurora/angular` exports two DI tokens that let you provide custom instances at the application or component level:

| Token | Type | Purpose |
|---|---|---|
| `HTML_ELEMENT_REGISTRY` | `InjectionToken<HtmlElementRegistry>` | Override the default element registry used by the Element Picker and Slash Menu. |
| `RTE_POLICY` | `InjectionToken<RtePolicy>` | Override the content policy (which elements/marks are allowed in which context). |

```typescript
// app.config.ts
import { HTML_ELEMENT_REGISTRY, RTE_POLICY } from '@aurora/angular';
import { myCustomRegistry, myPolicy } from './editor-policy';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HTML_ELEMENT_REGISTRY, useValue: myCustomRegistry },
    { provide: RTE_POLICY, useValue: myPolicy }
  ]
};
```

### `HtmlAuthoringService` API

`HtmlAuthoringService` is an `Injectable` provided at the component level. It can be injected into child components that need to interact with the authoring context without holding a direct reference to the editor.

```typescript
constructor(private authoring: HtmlAuthoringService) {}
```

| Method / Property | Signature | Description |
|---|---|---|
| `isCommandPaletteOpen` | `boolean` | State flag — set to `true` to open the Command Palette. |
| `isElementPickerOpen` | `boolean` | State flag — set to `true` to open the Element Picker. |
| `isInspectorOpen` | `boolean` | State flag — whether the Element Inspector is open. |
| `getEditor()` | `() => AuroraEditor \| null` | Returns the active editor instance. |
| `getRegistry()` | `() => HtmlElementRegistry` | Returns the current element registry. |
| `getPolicy()` | `() => RtePolicy` | Returns the active content policy. |
| `setPolicy(p)` | `(policy: RtePolicy) => void` | Replaces the content policy at runtime. |
| `getCurrentContext()` | `() => RteContext` | Returns the current editor context (ancestor tags, selection type, etc.). |
| `getAvailableElements()` | `() => HtmlElementDefinition[]` | Returns all elements insertable at the current cursor position. |
| `evaluateElement(def)` | `(def: HtmlElementDefinition) => ElementAvailability` | Returns `'allowed'`, `'restricted'`, or `'forbidden'` for the given element at the current cursor. |
| `insert(def, attrs?)` | `(def: HtmlElementDefinition, customAttrs?: Record<string,string>) => boolean` | Inserts the element at the current cursor. Returns `true` on success. |
| `inspect(el)` | `(element: HTMLElement) => ElementInspectorData` | Inspects the DOM element and opens the Inspector panel. |
| `closeInspector()` | `() => void` | Closes the Inspector panel. |
| `applyFix(issue)` | `(issue: AccessibilityIssue) => boolean` | Applies the auto-fix for the given WCAG accessibility issue. |
| `toggleFavorite(tag)` | `(tagName: string) => boolean` | Toggles the given tag in the user's favorites. Returns new state (`true` = favorited). |
| `getFavorites()` | `() => string[]` | Returns the user's favorite element tag names. |
| `getRecentElements()` | `() => string[]` | Returns recently inserted element tag names. |

### `AuroraThemeService` API

`AuroraThemeService` is an `Injectable` that manages theme state using Angular Signals. It is automatically attached to the host element during component initialization.

| Signal / Method | Type | Description |
|---|---|---|
| `currentTheme` | `Signal<string>` | Reactive signal holding the current theme name. |
| `currentTokens` | `Signal<ThemeTokens>` | Reactive signal holding the full set of resolved CSS design tokens. |
| `isDark` | `Signal<boolean>` | `true` when the active theme is a dark variant. |
| `setTheme(name)` | `(name: string) => void` | Switch to a different theme preset at runtime. |
| `setTokens(tokens)` | `(tokens: Partial<ThemeTokens>) => void` | Patch individual design tokens without changing the preset. |
| `setAutoInherit(enabled)` | `(enabled: boolean) => void` | Enable/disable inheriting CSS variables from the host page. |
| `getTokens()` | `() => ThemeTokens` | Returns the currently resolved token map. |

```typescript
constructor(private theme: AuroraThemeService) {}

switchToDark() {
  this.theme.setTheme('aurora-dark');
}

isDarkMode = computed(() => this.theme.isDark());
```

### Angular Usage Examples

#### Minimal Setup

```typescript
import { Component } from '@angular/core';
import { AuroraEditorComponent } from '@aurora/angular';
import type { EditorChange } from '@aurora/editor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AuroraEditorComponent],
  template: `
    <aurora-editor
      [toolbar]="true"
      (docChange)="onDocChange($event)"
    />
  `
})
export class AppComponent {
  onDocChange(change: EditorChange) {
    console.log('New doc:', change.document);
    console.log('Patches:', change.patches);
  }
}
```

#### With Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuroraEditorComponent } from '@aurora/angular';

@Component({
  standalone: true,
  imports: [AuroraEditorComponent, ReactiveFormsModule],
  template: `<aurora-editor [formControl]="editorControl" />`
})
export class FormPageComponent {
  editorControl = new FormControl(null);
}
```

#### Accessing the Raw Editor via `(editorReady)`

```typescript
import type { AuroraEditor } from '@aurora/editor';

onEditorReady(editor: AuroraEditor) {
  editor.on('focus', () => console.log('Editor focused'));
  editor.on('blur',  () => console.log('Editor blurred'));
}
```

---

## React Integration

### React: When to Use

Use `@aurora/react` when:

- Your host application uses **React 18+** (tested with React 19).
- You need **hook-based** access to editor state (`useAurora`, `useRteContext`, `useHtmlRegistry`).
- You are building a custom toolbar, slash menu, or inspector panel and need access to context state via `AuroraProvider`.
- You want to control the editor imperatively via a **`ref`** (`AuroraEditorRef`).

### `<AuroraEditor>` Props

> Also exported as `AuroraEditorComponent` — both names refer to the same implementation.

```tsx
import { AuroraEditor, type AuroraEditorRef } from '@aurora/react';
import { useRef } from 'react';

const ref = useRef<AuroraEditorRef>(null);

<AuroraEditor
  ref={ref}
  document={myDoc}
  onChange={handleChange}
  onSelectionChange={handleSelection}
  toolbar={true}
  legacyToolbar={false}
  mode="standard"
  theme="aurora-dark"
  tokens={myTokens}
  autoInherit={true}
  enableAuthoringFeatures={true}
  enableMobileActions={false}
  className="my-editor"
  style={{ minHeight: 400 }}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `document` | `AuroraDocument \| undefined` | `undefined` | Initial JSON document. If omitted, an empty paragraph is created. |
| `onChange` | `(change: EditorChange) => void` | `undefined` | Called every time the document changes. |
| `onSelectionChange` | `(selection: SelectionState) => void` | `undefined` | Called every time the cursor or selection state changes. |
| `toolbar` | `boolean` | `true` | Show the built-in Aurora toolbar above the editor. |
| `legacyToolbar` | `boolean` | `false` | When `true`, uses the vanilla `createToolbar()` factory instead of the React toolbar component. |
| `mode` | `'standard' \| 'html' \| 'readonly'` | `'standard'` | Editor interaction mode. |
| `policy` | `RtePolicy \| undefined` | `STANDARD_POLICIES.standard` | Custom content policy passed to `AuroraProvider`. |
| `theme` | `ThemePresetName \| string \| undefined` | `undefined` | Theme preset name or `'auto'` for host inheritance. |
| `tokens` | `Partial<ThemeTokens> \| undefined` | `undefined` | Override individual design tokens. |
| `autoInherit` | `boolean` | `true` when `theme` is `undefined` or `'auto'` | Inherit CSS variables from host page. |
| `enableAuthoringFeatures` | `boolean` | `true` | When `true`, wraps the editor in `<AuroraProvider>` so authoring widgets work. Set to `false` for a bare minimal editor without the Element Picker, Command Palette, and Inspector. |
| `enableMobileActions` | `boolean` | `false` | Render the `<AuroraMobileActions>` bottom drawer. |
| `className` | `string` | `''` | Additional CSS class names applied to the outermost container `<div>`. |
| `style` | `React.CSSProperties \| undefined` | `undefined` | Inline styles applied to the outermost container `<div>`. |
| `editorOptions` | `Omit<EditorOptions, 'document' \| 'element'>` | `undefined` | Advanced options forwarded to `createEditor()`. `document` and `element` are managed internally. |

### Ref API (`AuroraEditorRef`)

Pass a `ref` to `<AuroraEditor>` to get imperative access:

```tsx
const ref = useRef<AuroraEditorRef>(null);
<AuroraEditor ref={ref} ... />

// In event handlers:
ref.current?.execute('toggleBold');
const doc = ref.current?.getDocument();
```

| Method | Signature | Description |
|---|---|---|
| `getDocument()` | `() => AuroraDocument \| undefined` | Returns the current document. |
| `setDocument(doc)` | `(doc: AuroraDocument) => void` | Replaces the editor content. |
| `execute(name, input?)` | `(name: CommandName \| string, input?: unknown) => void` | Dispatches a command by name. |
| `export(request)` | `(request: ExportRequest) => string` | Serializes the document. `format` can be `'html'`, `'markdown'`, `'json'`, or `'text'`. |
| `focus()` | `() => void` | Focuses the editor surface. |
| `editor` | `AuroraEditor \| null` | Direct reference to the underlying core editor instance for advanced event subscriptions. |

### `AuroraProvider` & Context

`AuroraProvider` is the React context that powers authoring widgets. `<AuroraEditor enableAuthoringFeatures>` wraps itself automatically. Only use `AuroraProvider` directly when building custom widget components outside of `<AuroraEditor>`.

```tsx
import { AuroraProvider } from '@aurora/react';

<AuroraProvider editor={editorInstance} mode="html" policy={myPolicy}>
  <MyCustomToolbar />
  <AuroraEditor enableAuthoringFeatures={false} ... />
</AuroraProvider>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `editor` | `AuroraEditor \| null` | **required** | The core editor instance to attach context to. |
| `registry` | `HtmlElementRegistry \| undefined` | Global registry | Custom element registry. |
| `policy` | `RtePolicy \| undefined` | `STANDARD_POLICIES.standard` | Content policy controlling which elements are allowed. |
| `mode` | `EditorMode` | `'standard'` | Active editing mode. |
| `children` | `React.ReactNode` | **required** | Child components. |

**`AuroraContextValue` — all fields exposed by `useAurora()`:**

| Field | Type | Description |
|---|---|---|
| `editor` | `AuroraEditor \| null` | The core editor instance. |
| `registry` | `HtmlElementRegistry` | The active element registry. |
| `policy` | `RtePolicy` | The active content policy. |
| `mode` | `EditorMode` | Current editing mode. |
| `context` | `RteContext` | Live cursor context (ancestor tags, selection type, active node tags). Updates on every selection change. |
| `isElementPickerOpen` | `boolean` | Whether the Element Picker dialog is open. |
| `setElementPickerOpen` | `(open: boolean) => void` | Open/close the Element Picker. |
| `isCommandPaletteOpen` | `boolean` | Whether the Command Palette is open. |
| `setCommandPaletteOpen` | `(open: boolean) => void` | Open/close the Command Palette. |
| `isInspectorOpen` | `boolean` | Whether the Element Inspector panel is open. |
| `setInspectorOpen` | `(open: boolean) => void` | Open/close the Inspector. |
| `selectedElementForInspector` | `HTMLElement \| null` | The DOM element currently being inspected. |
| `inspectorData` | `ElementInspectorData \| null` | Full inspection result for the selected element. |
| `insert(def, attrs?)` | `(def, attrs?) => boolean` | Inserts the HTML element at the current cursor. Returns `true` on success. |
| `evaluateElement(def)` | `(def) => ElementAvailability` | Returns `'allowed'`, `'restricted'`, or `'forbidden'` for the given element at the current cursor. |
| `inspect(element)` | `(element: HTMLElement) => ElementInspectorData` | Inspects a DOM element and opens the Inspector panel. |
| `closeInspector()` | `() => void` | Closes the Inspector. |
| `applyFix(issue)` | `(issue: AccessibilityIssue) => boolean` | Applies the automatic WCAG fix for the given issue. |
| `toggleFavorite(tag)` | `(tagName: string) => boolean` | Toggles the tag in user favorites. Returns new state. |
| `getFavorites()` | `() => string[]` | Returns user's favorited element tag names. |
| `getRecentElements()` | `() => string[]` | Returns recently used element tag names. |

### React Hooks

All hooks **must** be called inside a component that is a descendant of `<AuroraProvider>`.

| Hook | Returns | Description |
|---|---|---|
| `useAurora()` | `AuroraContextValue` | Full context object. Throws if called outside `<AuroraProvider>`. |
| `useHtmlRegistry()` | `HtmlElementRegistry` | Shorthand for `useAurora().registry`. |
| `useRteContext()` | `RteContext` | Live cursor context — auto-updates on every selection change. |
| `useCommandPalette()` | `{ isOpen: boolean; setOpen: (open: boolean) => void }` | State helpers for the Command Palette dialog. |
| `useElementInspector()` | `{ isOpen, setOpen, data, inspect, closeInspector, applyFix }` | State and actions for the Element Inspector. |
| `useAuroraEditor(options?)` | `AuroraEditor \| null` | Low-level hook — creates and manages a raw `AuroraEditor` instance lifecycle without any React UI. Useful for headless integrations. |

#### `useAuroraEditor` — Low-level Hook

```tsx
import { useAuroraEditor } from '@aurora/react';

function HeadlessEditor() {
  const editor = useAuroraEditor({
    document: myDoc,
    element: document.getElementById('editor-root')!
  });

  useEffect(() => {
    if (!editor) return;
    const unsub = editor.on('change', (change) => {
      console.log('patches:', change.patches);
    });
    return unsub;
  }, [editor]);

  return null;
}
```

### React Usage Examples

#### Basic Editor

```tsx
import { AuroraEditor } from '@aurora/react';

export function MyEditor() {
  return (
    <AuroraEditor
      toolbar
      onChange={(change) => console.log(change.document)}
      style={{ minHeight: 300 }}
    />
  );
}
```

#### With Ref for Imperative Control

```tsx
import { useRef } from 'react';
import { AuroraEditor, type AuroraEditorRef } from '@aurora/react';

export function ControlledEditor() {
  const editorRef = useRef<AuroraEditorRef>(null);

  return (
    <>
      <button onClick={() => editorRef.current?.execute('toggleBold')}>Bold</button>
      <button onClick={() => editorRef.current?.execute('insertTable', { rows: 3, columns: 3 })}>Table</button>
      <button onClick={() => console.log(editorRef.current?.export({ format: 'html' }))}>Export HTML</button>
      <AuroraEditor ref={editorRef} toolbar />
    </>
  );
}
```

#### Custom Widget Using Hooks

```tsx
import { useAurora } from '@aurora/react';

function InsertFigureButton() {
  const { insert, evaluateElement } = useAurora();
  const figureDef = { tag: 'figure', label: 'Figure', category: 'media' };
  const availability = evaluateElement(figureDef);

  return (
    <button disabled={availability !== 'allowed'} onClick={() => insert(figureDef)}>
      Insert Figure
    </button>
  );
}
```

---

## Shared Editor Events

Both the Angular `(editorReady)` output and the React `ref.current.editor` expose the raw `AuroraEditor` instance, which emits the following events via `editor.on(eventName, listener)`:

### `change` Event

**Payload: `EditorChange`**

Fired every time the document content changes.

| Field | Type | Description |
|---|---|---|
| `document` | `AuroraDocument` | Full immutable snapshot of the updated document. |
| `patches` | `readonly JsonPatch[]` | RFC 6902 JSON Patches describing the diff from the previous document. |
| `origin` | `'user' \| 'command' \| 'import' \| 'api'` | Source of the change. |
| `transactionId` | `string` | Unique ID for this change transaction (useful for collaborative sync). |

```typescript
editor.on('change', (change) => {
  console.log(change.document);      // Full doc snapshot
  console.log(change.patches);       // RFC 6902 ops
  console.log(change.origin);        // 'user' | 'command' | 'import' | 'api'
  console.log(change.transactionId); // e.g., 'txn_abc123'
});
```

### `selectionChange` Event

**Payload: `SelectionState`**

Fired every time the cursor moves or the selection changes.

| Field | Type | Description |
|---|---|---|
| `empty` | `boolean` | `true` when there is no text selected (collapsed cursor). |
| `from` | `number` | Start position of the selection. |
| `to` | `number` | End position of the selection. |
| `selectedText` | `string \| undefined` | The selected text, if any. |
| `activeMarks` | `string[]` | List of currently active inline marks (e.g., `['bold', 'italic']`). |
| `activeBlockType` | `string` | Block node type at cursor (e.g., `'paragraph'`, `'heading'`, `'codeBlock'`). |
| `activeAlignment` | `string \| undefined` | Text alignment at cursor (`'left'`, `'center'`, `'right'`, `'justify'`). |
| `activeFontFamily` | `string \| undefined` | Active font family at cursor. |
| `activeFontSize` | `string \| undefined` | Active font size at cursor. |
| `isInTable` | `boolean \| undefined` | `true` when the cursor is inside a table cell. |
| `activeLinkAttrs` | `{ href: string; title?: string; target?: string } \| undefined` | Link attributes if cursor is on a link. |
| `selectedNodeType` | `string \| undefined` | Node type of a node selection (e.g., `'image'`, `'table'`). |
| `selectedNodeAttrs` | `Record<string, unknown> \| undefined` | Attributes of the selected node. |

```typescript
editor.on('selectionChange', (sel) => {
  if (sel.activeMarks.includes('bold')) console.log('bold is active');
  if (sel.isInTable) console.log('cursor is inside a table');
});
```

### `focus` / `blur` / `destroy` Events

These events carry no payload (`void`).

```typescript
editor.on('focus',   () => console.log('editor focused'));
editor.on('blur',    () => console.log('editor blurred'));
editor.on('destroy', () => console.log('editor destroyed'));
```

### `error` Event

**Payload: `EditorErrorEvent`**

| Field | Type | Description |
|---|---|---|
| `message` | `string` | Human-readable error description. |
| `code` | `string \| undefined` | Machine-readable error code. |
| `error` | `unknown` | The original error object, if available. |

```typescript
editor.on('error', (err) => {
  console.error(`[${err.code}] ${err.message}`, err.error);
});
```

> **All events return an unsubscribe function:**
> ```typescript
> const unsub = editor.on('change', handler);
> unsub(); // removes the listener
> ```

---

## Shared Command Reference

Both Angular's `component.execute(name, input?)` and React's `ref.current.execute(name, input?)` accept the following command names:

### Inline Formatting

| Command | Input | Description |
|---|---|---|
| `'toggleBold'` | — | Toggle bold on selection. |
| `'toggleItalic'` | — | Toggle italic on selection. |
| `'toggleUnderline'` | — | Toggle underline on selection. |
| `'toggleStrike'` | — | Toggle strikethrough on selection. |
| `'toggleCode'` | — | Toggle inline code mark. |
| `'toggleSubscript'` | — | Toggle subscript mark. |
| `'toggleSuperscript'` | — | Toggle superscript mark. |
| `'setTextColor'` | `{ color: string }` | Set text color (hex or CSS value). |
| `'setTextHighlight'` | `{ color: string }` | Set text highlight color. |
| `'setFontFamily'` | `{ fontFamily: string }` | Set font family for selection. |
| `'setFontSize'` | `{ fontSize: string }` | Set font size (e.g., `'18px'`, `'1.2em'`). |
| `'clearFormatting'` | — | Remove all inline formatting from selection. |
| `'insertText'` | `{ text: string }` | Insert plain text at the cursor. |

### Block Formatting

| Command | Input | Description |
|---|---|---|
| `'setHeading'` | `{ level: 1 \| 2 \| 3 \| 4 \| 5 \| 6 }` | Convert current block to a heading. |
| `'setParagraph'` | — | Convert current block to a paragraph. |
| `'toggleBlockquote'` | — | Toggle blockquote wrapping. |
| `'toggleCodeBlock'` | — | Toggle fenced code block. |
| `'toggleBulletList'` | — | Toggle unordered list. |
| `'toggleOrderedList'` | — | Toggle ordered list. |
| `'insertHorizontalRule'` | — | Insert a `<hr>`. |
| `'setTextAlign'` | `{ alignment: 'left' \| 'center' \| 'right' \| 'justify' }` | Set block-level alignment. |
| `'alignLeft'` | — | Shorthand — align left. |
| `'alignCenter'` | — | Shorthand — align center. |
| `'alignRight'` | — | Shorthand — align right. |
| `'alignJustify'` | — | Shorthand — justify. |

### Links & Media

| Command | Input | Description |
|---|---|---|
| `'setLink'` | `{ href: string; title?: string; target?: string }` | Create or update a link on the selection. |
| `'removeLink'` | — | Remove the link at the cursor. |
| `'insertImage'` | `{ src: string; alt?: string; title?: string }` | Insert an image node. |
| `'updateImage'` | `{ src?: string; alt?: string; title?: string }` | Update the selected image's attributes. |
| `'deleteImage'` | — | Delete the selected image. |
| `'insertEmbed'` | `{ src: string; type?: string }` | Insert an embed (iframe/video). |

### Tables

| Command | Input | Description |
|---|---|---|
| `'insertTable'` | `{ rows: number; columns: number; header?: boolean }` | Insert a new table. |
| `'updateTable'` | `{ ... }` | Update table-level attributes. |
| `'updateTableCell'` | `{ ... }` | Update the current cell's attributes. |
| `'updateTableRow'` | `{ ... }` | Update the current row's attributes. |
| `'setTableColWidth'` | `{ colIndex: number; width: number }` | Set a column's width in pixels. |
| `'setTableRowHeight'` | `{ height: number }` | Set the current row's height. |
| `'distributeTableCols'` | — | Distribute all columns equally. |
| `'deleteTable'` | — | Delete the entire table. |
| `'addTableRowAbove'` | — | Add a row above the current row. |
| `'addTableRowBelow'` | — | Add a row below the current row. |
| `'deleteTableRow'` | — | Delete the current row. |
| `'addTableColBefore'` | — | Add a column before the current column. |
| `'addTableColAfter'` | — | Add a column after the current column. |
| `'deleteTableCol'` | — | Delete the current column. |

### Mentions & Custom Blocks

| Command | Input | Description |
|---|---|---|
| `'insertMention'` | `{ id: string; label: string; [key: string]: unknown }` | Insert a mention node. |
| `'insertCustomBlock'` | `{ type: string; attrs?: Record<string, unknown> }` | Insert a registered custom block. |
| `'insertCallout'` | `{ variant?: 'info' \| 'warning' \| 'error' \| 'success' }` | Insert a callout block. |
| `'insertDetails'` | `{ summary?: string }` | Insert a `<details>/<summary>` disclosure block. |

### History

| Command | Input | Description |
|---|---|---|
| `'undo'` | — | Undo the last change. |
| `'redo'` | — | Redo the last undone change. |

All commands return a `CommandResult`:

```typescript
interface CommandResult {
  success: boolean;
  message?: string; // present when success is false
}
```

---

## Theme System

Both packages share the same theme system from `@aurora/ui`.

### Available Presets

| Preset Name | Style |
|---|---|
| `'aurora-dark'` | Aurora brand dark (default) |
| `'aurora-light'` | Aurora brand light |
| `'shadcn-dark'` | Shadcn/Tailwind dark |
| `'shadcn-light'` | Shadcn/Tailwind light |
| `'linear-dark'` | Linear app dark |
| `'enterprise-slate'` | Enterprise slate dark |
| `'material-dark'` | Material 3 dark |
| `'material-light'` | Material 3 light |
| `'high-contrast'` | WCAG high contrast |
| `'auto'` | Inherit from host page CSS variables |

### Token Override Example

```html
<!-- Angular -->
<aurora-editor theme="aurora-dark" [tokens]="{ '--aurora-primary': '#FF4D6D' }" />
```

```tsx
{/* React */}
<AuroraEditor theme="aurora-dark" tokens={{ '--aurora-primary': '#FF4D6D', '--aurora-bg': '#0a0a0a' }} />
```
