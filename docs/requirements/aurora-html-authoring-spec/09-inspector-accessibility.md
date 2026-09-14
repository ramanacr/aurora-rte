# Inspector and Accessibility

## Element inspector

Every selected element should expose:
- semantic tag
- attributes
- ID
- classes
- styles
- data attributes
- accessibility properties
- HTML preview
- source location/model path

## Accessibility model

```ts
interface AccessibilityMetadata {
  requiresLabel?: boolean;
  recommendedAttributes?: string[];
  validationRules?: string[];
}
```

Examples:
- `img`: `alt`
- `iframe`: `title`
- `button`: accessible name
- form controls: associated label
- `table`: caption and header semantics where appropriate
- landmarks: meaningful accessible names when duplicated

## Validation severity

- error: invalid or inaccessible output
- warning: recommended improvement
- info: optional enhancement

## Auto-fix examples

- Add missing image alt text prompt
- Associate label with input
- Add iframe title
- Convert visual bold to semantic `strong` where appropriate
- Add table header row
