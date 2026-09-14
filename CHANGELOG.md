# Changelog

All notable changes to Aurora RTE are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-14

### 🚀 Features
- feat(spec): implement full Aurora HTML Authoring Specification across all layers
- feat(angular): implement standalone Angular 17+ editor components with `@if`/`@for` control flow and WCAG accessibility auditor
- feat(react): implement native React 19 editor components with hook-driven context and action dispatching
- feat(table): add full-scale context menu, properties dialog, and interactive drag resizing for table rows and columns
- feat(menu): implement single-row overflow toolbar with cascading multi-level submenus bound to body
- feat(source-mode): add bi-directional live-sync raw HTML code editor with debounced parsing and strict legacy tag migration
- feat(collab): add real-time remote presence carets with client colors and review gutter supporting anchored comments and suggestion diffs (Track Changes)
- feat(release): implement multi-target packaging pipeline, standalone web-component CDN bundle, and SHA-256 cryptographic verification

### 🐛 Bug Fixes & Improvements
- fix(dropdown): resolve z-index clipping by binding cascading submenus and dropdown menus directly to `document.body`
- fix(collab): add industry-standard debouncing for collaborative edits
- fix(boundaries): maintain strict architectural boundary isolation for `@aurora/engine-prosemirror`

### 🔧 Maintenance & Packaging
- chore: establish conventional commit auto-versioning tool (`scripts/auto-version.mjs`)
- chore: configure `publishConfig` and granular distribution manifests across all 9 public packages
- chore: build and distribute standalone IIFE CDN bundle `aurora-editor.min.js`

