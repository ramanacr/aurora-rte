# Product Architecture

## Goal

Provide complete, standards-aware HTML authoring coverage through progressive disclosure.

## Authoring surfaces

- Formatting toolbar
- Insert menu
- All HTML Elements picker
- Slash command menu
- Command palette
- Context menu
- Element inspector
- HTML source/developer mode

## Design principles

- Semantic intent over raw tag memorization
- Context-aware insertion
- Composite structures generated as valid scaffolds
- Responsive progressive disclosure
- Secure raw HTML handling
- Preserve imported/custom elements where policy permits
- Accessibility-aware authoring
- User-customizable command priorities

## Modes

### Standard
Common authoring elements and formatting.

### Advanced
Semantic and less-common authorable elements.

### Developer
Raw tags, attributes, custom elements, source editing, metadata, and technical nodes.

### Email
Restricted email-compatible element subset.

### CMS
Schema/policy controlled element subset.
