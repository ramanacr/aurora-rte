# Aurora Core Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Apache-2.0 versioned document model and embeddable, accessible rich-text editor core.

**Architecture:** Public packages own the JSON model, stable facade, commands, events, features, and UI. ProseMirror is isolated in one adapter package; host services are injected only through typed capabilities.

**Tech Stack:** TypeScript, pnpm workspaces, ProseMirror, Zod or TypeBox, Vitest, fast-check, Testing Library, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-08-27-rich-text-editor-design.md`

## Global Constraints

- Core is Apache-2.0 and works without a network call, account, backend, telemetry, AI provider, or commercial package.
- Persist only versioned Aurora JSON; HTML/Markdown are validated interchange formats.
- Never expose ProseMirror types outside `@aurora/engine-prosemirror`.
- WCAG 2.2 AA, keyboard-only operation, and screen-reader semantics are release gates.
- Validate all untrusted documents, HTML, URLs, embeds, extension data, and adapter results.
- Modern Chrome, Edge, Firefox, Safari; desktop-first with responsive tablet/mobile support.

---

### Task 1: Create workspace and model contracts

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `packages/model/src/document.ts`, `packages/model/src/validate.ts`, `packages/model/src/migrate.ts`
- Test: `packages/model/test/validate.test.ts`, `packages/model/test/migrate.test.ts`

**Interfaces:**
- Produces `AuroraDocument`, `validateDocument(input)`, and `migrateDocument(input, targetVersion)` for every later task.

- [ ] **Step 1: Write failing model tests**

```ts
it('rejects an invalid document and accepts the current format', () => {
  expect(() => validateDocument({ format: 'aurora', version: 0, content: [] })).toThrow();
  expect(validateDocument({ format: 'aurora', version: 1, content: [] }).version).toBe(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aurora/model test validate.test.ts`  
Expected: FAIL because the package and validator do not exist.

- [ ] **Step 3: Implement the smallest model validator and migration registry**

```ts
export interface AuroraDocument { format: 'aurora'; version: number; content: AuroraNode[] }
export function validateDocument(input: unknown): AuroraDocument { /* schema parse with limits */ }
export function migrateDocument(input: unknown, targetVersion: number): AuroraDocument { /* ordered migrations */ }
```

- [ ] **Step 4: Run focused and property tests**

Run: `pnpm --filter @aurora/model test && pnpm --filter @aurora/model test:property`  
Expected: PASS; invalid depth/node/size fixtures are rejected and equivalent documents round-trip deterministically.

- [ ] **Step 5: Commit**

Run: `git add package.json pnpm-workspace.yaml packages/model && git commit -m "feat(model): add versioned document contracts"`

### Task 2: Implement the engine adapter and editor facade

**Files:**
- Create: `packages/engine-prosemirror/src/adapter.ts`, `packages/editor/src/create-editor.ts`, `packages/editor/src/events.ts`, `packages/editor/src/commands.ts`
- Test: `packages/editor/test/create-editor.test.ts`, `packages/engine-prosemirror/test/adapter-contract.test.ts`

**Interfaces:**
- Consumes `AuroraDocument`, `validateDocument`.
- Produces `createEditor(options): AuroraEditor`, `EditorChange`, `execute(name, input)`, and `destroy()`.

- [ ] **Step 1: Write failing facade tests**

```ts
it('emits a valid Aurora change without exposing engine state', () => {
  const editor = createEditor({ document: emptyDocument, features: [] });
  const changes: EditorChange[] = [];
  editor.on('change', change => changes.push(change));
  editor.execute('insertText', { text: 'Safe text' });
  expect(changes[0].document.format).toBe('aurora');
  expect('proseMirrorState' in editor).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aurora/editor test create-editor.test.ts`  
Expected: FAIL because `createEditor` is missing.

- [ ] **Step 3: Implement adapter boundary and facade**

```ts
export function createEditor(options: EditorOptions): AuroraEditor {
  const state = createPrivateEngineState(validateDocument(options.document));
  return { getDocument, setDocument, execute, export: exportDocument, focus, on, destroy };
}
```

- [ ] **Step 4: Run focused tests and typecheck**

Run: `pnpm --filter @aurora/editor test && pnpm typecheck`  
Expected: PASS; adapter contract test proves no engine types appear in public declarations.

- [ ] **Step 5: Commit**

Run: `git add packages/engine-prosemirror packages/editor && git commit -m "feat(editor): add engine-isolated editor facade"`

### Task 3: Add safe core features and serialization

**Files:**
- Create: `packages/features/src/basic.ts`, `packages/features/src/tables.ts`, `packages/features/src/links.ts`, `packages/editor/src/html.ts`, `packages/editor/src/markdown.ts`
- Test: `packages/editor/test/html-sanitize.test.ts`, `packages/editor/test/markdown-roundtrip.test.ts`, `tests/fixtures/html/hostile.html`

**Interfaces:**
- Consumes `AuroraEditor` command/feature registration.
- Produces core formatting, table/link features and `importHtml`, `exportHtml`, `importMarkdown`, `exportMarkdown`.

- [ ] **Step 1: Write failing sanitization and round-trip tests**

```ts
it('drops executable markup while retaining approved content', () => {
  const document = importHtml('<p>Hello</p><img src=x onerror=alert(1)>');
  expect(exportHtml(document)).toBe('<p>Hello</p><img src="x">');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aurora/editor test html-sanitize.test.ts`  
Expected: FAIL because the importer is missing.

- [ ] **Step 3: Implement allow-list import/export**

```ts
export function importHtml(source: string): AuroraDocument { /* parse, allow-list, validate */ }
export function exportHtml(document: AuroraDocument): string { /* deterministic serializer */ }
```

- [ ] **Step 4: Run security, fuzz, and feature tests**

Run: `pnpm test:security && pnpm test:property && pnpm --filter @aurora/features test`  
Expected: PASS; hostile URL/SVG/event-handler fixtures are removed without data loss to approved content.

- [ ] **Step 5: Commit**

Run: `git add packages/features packages/editor tests/fixtures && git commit -m "feat(core): add safe rich-text features and serialization"`

### Task 4: Build accessible UI and performance gates

**Files:**
- Create: `packages/ui/src/toolbar.ts`, `packages/ui/src/dialog.ts`, `packages/ui/src/theme.ts`, `apps/playground/src/main.ts`
- Test: `packages/ui/test/toolbar.a11y.test.tsx`, `tests/e2e/editing.spec.ts`, `tests/perf/typing.spec.ts`

**Interfaces:**
- Consumes only `AuroraEditor` commands/events and theme tokens.
- Produces accessible toolbar/dialog primitives and measurable core benchmark flows.

- [ ] **Step 1: Write failing keyboard and accessibility tests**

```ts
it('supports keyboard toolbar navigation with accessible names', async () => {
  render(<Toolbar editor={editor} />);
  await userEvent.tab();
  expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aurora/ui test toolbar.a11y.test.tsx`  
Expected: FAIL because the toolbar is absent.

- [ ] **Step 3: Implement UI with command-only interaction**

```ts
export function Toolbar({ editor }: { editor: AuroraEditor }) {
  return <button aria-label="Bold" onClick={() => editor.execute('toggleBold', {})}>B</button>;
}
```

- [ ] **Step 4: Run accessibility, E2E, and baseline performance checks**

Run: `pnpm test:a11y && pnpm test:e2e && pnpm test:perf`  
Expected: PASS in the supported browser matrix and benchmark baselines written to version control.

- [ ] **Step 5: Commit**

Run: `git add packages/ui apps/playground tests && git commit -m "feat(ui): add accessible editor controls and benchmarks"`
