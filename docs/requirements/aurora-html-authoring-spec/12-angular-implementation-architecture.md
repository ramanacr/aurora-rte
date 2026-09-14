# Angular Implementation Architecture

## Suggested package structure

```text
aurora-rte/
├── core/
│   ├── html-element-registry/
│   ├── insertion-engine/
│   ├── context-validator/
│   ├── command-registry/
│   ├── selection-engine/
│   └── transaction-engine/
├── menus/
│   ├── insert-menu/
│   ├── html-element-picker/
│   ├── slash-menu/
│   ├── context-menu/
│   └── overflow-menu/
├── toolbar/
│   ├── desktop-toolbar/
│   ├── tablet-toolbar/
│   ├── mobile-toolbar/
│   └── toolbar-layout-engine/
├── inspectors/
│   ├── element-inspector/
│   ├── attribute-inspector/
│   ├── accessibility-inspector/
│   └── style-inspector/
├── elements/
│   ├── text/
│   ├── structure/
│   ├── media/
│   ├── tables/
│   ├── forms/
│   ├── interactive/
│   └── custom/
└── validation/
    ├── html-validator/
    ├── nesting-rules/
    ├── accessibility-rules/
    └── security-policy/
```

## Component hierarchy

```html
<aurora-rte>
  <aurora-rte-toolbar />
  <aurora-rte-editor />
  <aurora-rte-mobile-actions />
  <aurora-insert-menu />
  <aurora-html-element-picker />
  <aurora-slash-command-menu />
  <aurora-command-palette />
  <aurora-context-menu />
  <aurora-element-inspector />
</aurora-rte>
```

## Angular guidance

- Use standalone components
- Use signals for UI state where appropriate
- Keep registry and validation framework-agnostic
- Use dependency injection tokens for plugin registration
- Keep DOM mutation behind transactions
- Avoid toolbar components directly manipulating DOM
- Make renderers declarative from command definitions
- Use CDK Overlay for menus, sheets, dialogs, and inspectors
- Support RTL, keyboard navigation, high contrast, and reduced motion
