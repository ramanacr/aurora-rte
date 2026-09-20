# About Aurora Editor

Aurora Editor is an **enterprise-grade, framework-agnostic rich-text and HTML5 authoring engine** built for modern web applications. It delivers a zero-vendor-lock-in editing experience with native adapters for React 19, Angular 17+, Web Components (Custom Elements v1), and headless Vanilla JS.

---

## Project Mission

Aurora was created to solve a real gap in the enterprise rich-text editor market: most existing solutions either tie you to a specific framework, ship heavyweight runtimes, or sacrifice semantic HTML correctness for ease of use.

Aurora's mission is to give product teams a **single, governed authoring core** they can embed anywhere — in a React SaaS dashboard, an Angular enterprise portal, a Web Component micro-frontend, or a plain HTML page — without rewriting integration code when the host framework changes.

---

## Key Capabilities

| Capability | Details |
|---|---|
| **Framework Freedom** | Native zero-overhead adapters for React 19, Angular 17+ (standalone, `@if`/`@for`), Custom Elements v1, and headless Vanilla JS |
| **Zero-Install CDN** | Pre-bundled IIFE `aurora-editor.min.js` — drop in via `<script>` tag, no build step required |
| **Semantic HTML5 Authoring** | Full block insertion palette for `<figure>`, `<details>`, `<dialog>`, `<form>`, `<address>`, `<time>`, `<ruby>`, and more |
| **Bi-directional Source Mode** | Split raw HTML editor with live debounced AST re-parsing and legacy tag migration (`<font>` → `<span>`) |
| **Interactive Table Engine** | Drag-resizable rows/columns, context menu, properties dialog, and accessible header support |
| **Real-Time Collaboration** | Remote presence carets with per-client color coding, anchored inline comments, and Track Changes suggestion diffs |
| **WCAG 2.1 AA Auditor** | Live accessibility inspector with one-click automated fixes for images, tables, links, and form elements |
| **Enterprise Review Workflow** | Tenant-scoped audit logs, suggestion accept/reject, and a governed review gutter |
| **Theming System** | 9 built-in presets (Aurora Dark/Light, Shadcn, Linear, Material 3, High Contrast) plus full CSS token override support |
| **Security by Default** | Strict allow-list HTML parser, event handler neutralization, URL scheme allowlisting, sandboxed embeds |

---

## Architecture

Aurora is structured as a **pnpm monorepo** with strict architectural boundary enforcement. Each package has a single, well-defined responsibility:

| Package | Role |
|---|---|
| `@aurora/model` | Immutable `AuroraDocument` JSON AST schema and RFC 6902 JSON Patch types |
| `@aurora/editor` | Public editor facade — `createEditor()`, commands, events, export pipeline |
| `@aurora/engine-prosemirror` | Private ProseMirror implementation (strict boundary — never imported directly) |
| `@aurora/ui` | Framework-neutral UI widgets — toolbar, bubble menu, slash menu, theme system, WCAG auditor |
| `@aurora/features` | Content utilities — word/character count, slash commands, clipboard paste normalization |
| `@aurora/extension-sdk` | Public API for authoring custom blocks, schemas, and plugins |
| `@aurora/enterprise-review` | Track Changes engine, suggestion diffs, anchored comments, and audit service |
| `@aurora/angular` | Angular 17+ standalone component (`<aurora-editor>`), DI tokens, Signals-based theme service |
| `@aurora/react` | React 19 component (`<AuroraEditor>`), hooks (`useAurora`, `useRteContext`), and context provider |
| `@aurora/web-component` | Custom Elements v1 web component with Shadow DOM and attribute reflection |

---

## Technology Stack

- **Language:** TypeScript 7+ (strict mode, `noUncheckedIndexedAccess`)
- **Editor Engine:** ProseMirror (isolated behind `@aurora/engine-prosemirror` — never a public dependency)
- **React Adapter:** React 19.3
- **Angular Adapter:** Angular 22 (Standalone Components, Signals)
- **Testing:** Vitest 5, 81+ passing tests including property-based, security, accessibility, and e2e suites
- **Build:** Vite 8 + TypeScript project references
- **Package Manager:** pnpm workspaces

---

## Version History

See the full [Changelog](../../../CHANGELOG.md) for a detailed history of releases.

| Version | Date | Highlights |
|---|---|---|
| **0.1.0** | 2026-09-14 | Initial public release — full HTML Authoring Spec, Angular 17+ & React 19 adapters, real-time collaboration, review gutter, source mode, table engine |

---

## License

Aurora Editor is released under the **MIT License**.

Copyright © 2026 Ramana Reddy Chamakura

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

See the full [LICENSE](../../../LICENSE) file for the complete license text.

---

## Links

- **Live Playground:** [ramanacr.github.io/aurora-rte](https://ramanacr.github.io/aurora-rte/)
- **GitHub Repository:** [github.com/ramanacr/aurora-rte](https://github.com/ramanacr/aurora-rte)
- **GitHub Packages:** [github.com/ramanacr/aurora-rte/packages](https://github.com/ramanacr/aurora-rte/packages)
- **Releases:** [github.com/ramanacr/aurora-rte/releases](https://github.com/ramanacr/aurora-rte/releases)
