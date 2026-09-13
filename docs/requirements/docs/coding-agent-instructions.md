# Coding Agent Instructions

## Read first

Read the approved design, exactly one selected plan, relevant API/security/testing documents, and existing package conventions before editing. Stop for clarification if interfaces are unclear.

## Required rules

1. Write the focused failing test, run it, make the minimal implementation, rerun it, then run the affected suite.
2. Never expose ProseMirror types outside @aurora/engine-prosemirror.
3. Treat HTML, JSON, URLs, embeds, extension data, and adapter responses as untrusted until validated.
4. Keep core free of network, storage, telemetry, AI, identity, and commercial imports.
5. Add migration fixtures for every schema change.
6. Make every UI feature keyboard-operable and testable by accessible name.
7. Keep packages tree-shakable; add dependencies only with justification.
8. Public API or JSON changes require an ADR, migration, semver decision, and release note.

## Before committing

Run formatter, lint, typecheck, focused tests, affected suite, accessibility checks, and relevant browser/bundle checks. Review diffs for privacy/security impact, API breakage, generated artifacts, and accidental package-boundary violations.

