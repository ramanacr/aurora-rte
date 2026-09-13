# Aurora Integration Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship framework-neutral embedding, safe host capabilities, extension SDK, documentation, and release packaging.

**Architecture:** All integrations are adapters over `@aurora/editor`; none may contain editing behavior unavailable to TypeScript consumers.

**Tech Stack:** TypeScript, Lit or standards-native custom elements, Angular, React, Vitest, Playwright, API Extractor, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-27-rich-text-editor-design.md`

## Global Constraints

- Keep core client-side, unbranded, WCAG 2.2 AA, and tree-shakable.
- Use host capability adapters for every networked feature.
- Maintain public API semver and two-major document migration support.

---

### Task 1: Implement the extension SDK

**Files:**
- Create: `packages/extension-sdk/src/types.ts`, `packages/extension-sdk/src/registry.ts`
- Test: `packages/extension-sdk/test/registry.test.ts`

**Interfaces:** Produces `AuroraExtension`, `registerExtension(extension)`, and `validateExtensionConfig(id, value)`.

- [ ] **Step 1: Write the failing duplicate-id test**

```ts
expect(() => registry.register(extension)).not.toThrow();
expect(() => registry.register(extension)).toThrow('duplicate extension id');
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @aurora/extension-sdk test registry.test.ts`  
Expected: FAIL because registry is absent.

- [ ] **Step 3: Implement registry validation**

```ts
register(extension: AuroraExtension): void { assertNamespacedId(extension.id); assertUnique(extension.id); }
```

- [ ] **Step 4: Run tests and public API extraction**

Run: `pnpm --filter @aurora/extension-sdk test && pnpm api:check`  
Expected: PASS with a reviewed API report.

- [ ] **Step 5: Commit**

Run: `git add packages/extension-sdk && git commit -m "feat(sdk): add safe extension registry"`

### Task 2: Ship Web Component, Angular, and React bridges

**Files:**
- Create: `packages/web-component/src/aurora-editor.ts`, `packages/angular/src/editor.component.ts`, `packages/react/src/editor.tsx`
- Test: `packages/web-component/test/element.test.ts`, `packages/angular/test/editor.component.spec.ts`, `packages/react/test/editor.test.tsx`

**Interfaces:** Consumes `createEditor`; produces `<aurora-editor>`, `AuroraEditorComponent`, and `useAuroraEditor`.

- [ ] **Step 1: Write failing bridge parity tests**

```ts
it('emits the same Aurora document change as the core facade', async () => {
  const onChange = vi.fn();
  render(<AuroraEditor document={emptyDocument} onChange={onChange} />);
  await userEvent.type(screen.getByRole('textbox'), 'x');
  expect(onChange.mock.calls[0][0].document.format).toBe('aurora');
});
```

- [ ] **Step 2: Run each focused bridge test**

Run: `pnpm --filter @aurora/web-component test && pnpm --filter @aurora/angular test && pnpm --filter @aurora/react test`  
Expected: FAIL because bridge packages are absent.

- [ ] **Step 3: Implement thin lifecycle adapters**

```ts
export function useAuroraEditor(options: EditorOptions) { return useMemo(() => createEditor(options), []); }
```

- [ ] **Step 4: Run parity, accessibility, and browser checks**

Run: `pnpm test:bridges && pnpm test:a11y && pnpm test:e2e -- --project=chromium`  
Expected: PASS with equivalent document events and accessible controls.

- [ ] **Step 5: Commit**

Run: `git add packages/web-component packages/angular packages/react && git commit -m "feat(integrations): add framework bridges"`

### Task 3: Publish docs, playground, and release controls

**Files:**
- Create: `apps/docs/`, `apps/playground/src/examples/custom-block.ts`, `.github/workflows/release.yml`, `scripts/check-package-boundaries.mjs`
- Test: `tests/e2e/playground.spec.ts`, `scripts/check-package-boundaries.test.mjs`

**Interfaces:** Produces tested quick starts, extension examples, API reports, package boundary checks, and signed release pipeline.

- [ ] **Step 1: Write failing boundary test**

```js
assert.throws(() => checkImports('packages/editor/src/index.ts', ['@aurora/enterprise-review']));
```

- [ ] **Step 2: Run it**

Run: `node --test scripts/check-package-boundaries.test.mjs`  
Expected: FAIL because policy script is missing.

- [ ] **Step 3: Implement docs examples and CI policy**

```js
export function checkImports(file, forbidden) { /* parse imports and reject forbidden package prefixes */ }
```

- [ ] **Step 4: Run docs build, playground E2E, and release dry-run**

Run: `pnpm docs:build && pnpm test:e2e -- tests/e2e/playground.spec.ts && pnpm release:dry-run`  
Expected: PASS; examples compile without private engine imports.

- [ ] **Step 5: Commit**

Run: `git add apps scripts .github && git commit -m "docs: publish integration guides and release safeguards"`
