# Responsive Menu System

## Rendering strategy

One command registry, multiple renderers:

```text
Command Registry
  -> Toolbar Layout Engine
     -> Desktop Renderer
     -> Tablet Renderer
     -> Mobile Renderer
     -> Bottom Sheet Renderer
```

## Surfaces

### Desktop
- Full toolbar
- Group dropdowns
- Insert menu
- Side inspector
- Command palette

### Tablet
- Compact toolbar
- Overflow menu
- Modal picker
- Touch-sized targets

### Mobile
- Minimal top bar
- Bottom action bar
- Full-height insert sheet
- Full-screen inspector
- Search-first element picker

## Suggested breakpoints

- >= 1200px: expanded
- 900–1199px: standard
- 600–899px: compact
- 400–599px: mobile
- < 400px: minimal

Use measured available width rather than relying exclusively on viewport breakpoints.

## Responsive metadata

```ts
interface ResponsiveCommandMetadata {
  priority: number;
  estimatedWidth: number;
  collapseGroup?: string;
  preferredSurface:
    | 'toolbar'
    | 'dropdown'
    | 'overflow'
    | 'bottom-sheet'
    | 'command-palette';
}
```

## Layout algorithm

1. Measure available width
2. Reserve mandatory commands
3. Sort by priority
4. Place commands while width permits
5. Collapse complete groups where possible
6. Move remaining commands to overflow
7. Reserve overflow button width
8. Recalculate after localization/font scaling
9. Switch renderer for mobile mode

## Mobile insert sheet

Sections:
- Search
- Recently used
- Favorites
- Suggested for current context
- Categories
- All HTML elements

Accessibility:
- focus trap
- escape/back dismissal
- keyboard navigation
- screen-reader labels
- safe-area padding
