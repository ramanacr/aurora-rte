# Testing and Quality Strategy

| Layer | Scope | Tooling |
|---|---|---|
| Unit | Validation, migrations, commands, serializers | Vitest |
| Property/fuzz | Parser and transformation invariants | fast-check |
| Component | Toolbar, dialog, keyboard/focus | Testing Library |
| E2E | Browser, IME, clipboard, adapters, bridges | Playwright |
| Accessibility | WCAG and manual AT smoke paths | axe-core plus manual |
| Performance | Startup, typing, large docs, bundle | Playwright traces and size-limit |

Run Chrome, Edge, Firefox, and Safari scenarios for selection, undo/redo, copy/paste, Word paste, tables, IME, shortcuts, screen-reader labels, responsive controls, imports/exports, custom blocks, and extension errors.

Establish baseline budgets in the foundation milestone. A release cannot include a critical accessibility defect, sanitizer regression, content-loss migration, or unreviewed bundle regression.
