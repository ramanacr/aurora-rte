# ADR-001: Use ProseMirror behind an internal adapter

**Status:** Accepted

Use ProseMirror as the internal engine in @aurora/engine-prosemirror. Persist and expose only Aurora model/API types. This gains mature schema, selection, transaction, history, and plugin primitives while Aurora owns the API and UX. Add adapter contract tests and prohibit engine imports by consumers.

