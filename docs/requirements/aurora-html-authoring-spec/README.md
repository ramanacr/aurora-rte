# Aurora Web RTE — HTML Authoring Implementation Documentation

This package defines the implementation architecture for exposing comprehensive HTML authoring capabilities in Aurora Web RTE without creating an unusable flat tag toolbar.

## Documents

1. Product and UX architecture
2. HTML element taxonomy
3. Element registry schema
4. Context validation and insertion engine
5. Composite element templates
6. Responsive toolbar and menu behavior
7. Slash commands and command palette
8. Inspector and accessibility model
9. Security and sanitization
10. Import/preserve behavior
11. Angular component architecture
12. Implementation roadmap
13. Acceptance criteria

## Core principle

The HTML Element Registry is the source of truth. Toolbar, insert menus, slash commands, command palette, context menus, and inspectors are projections of that registry.
