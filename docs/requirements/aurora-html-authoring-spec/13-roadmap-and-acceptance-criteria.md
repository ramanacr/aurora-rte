# Roadmap and Acceptance Criteria

## Phase 1 — Core

- paragraph, headings, lists
- links, images, tables
- quotes, code blocks
- basic containers
- insert menu
- desktop responsive toolbar

## Phase 2 — Semantic HTML

- section, article, aside, header, footer, main, nav
- figure, figcaption
- details, summary
- abbr, cite, time, data
- all-elements picker

## Phase 3 — Forms and interactive

- form controls
- dialog
- popover
- progress
- meter
- canvas
- SVG
- embeds

## Phase 4 — Developer platform

- raw HTML
- custom elements
- Web Components
- metadata manager
- attribute inspector
- source mode
- policy engine

## Phase 5 — Intelligent authoring

- context recommendations
- accessibility auto-fix
- semantic conversion
- legacy migration
- CMS schema mode

## Acceptance criteria

### Functional
- Every supported element has a registry definition
- Every element has a valid insertion strategy
- Invalid nesting is prevented or normalized
- Composite elements generate valid scaffolds
- Contextual children cannot be inserted at invalid locations
- All elements are searchable
- Custom elements can be registered through plugins

### Responsive
- Toolbar adapts without horizontal clipping
- Mobile uses bottom-sheet/full-screen menus
- Touch targets meet accessibility guidance
- Keyboard navigation works on desktop/tablet
- Menus account for localization and font scaling

### Security
- Raw HTML is sanitized
- Scripts and event handlers are policy controlled
- URLs are protocol validated
- Restricted elements require explicit permission

### Accessibility
- Menus are keyboard navigable
- Focus is managed correctly
- Screen-reader labels exist
- Element-specific accessibility warnings are surfaced
