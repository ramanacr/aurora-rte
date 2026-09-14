# Security and Sanitization

Raw HTML must never bypass policy.

## Pipeline

```text
Raw HTML
 -> Parse
 -> Element allowlist
 -> Attribute allowlist
 -> URL validation
 -> Event-handler removal
 -> Script filtering
 -> CSS sanitization
 -> Custom-element policy
 -> DOM/model insertion
```

## Restricted features

Potentially restricted:
- `script`
- inline event handlers such as `onclick`
- `javascript:` URLs
- unsafe iframe sources
- unsafe object/embed sources
- arbitrary style injection
- external resource loading
- custom elements not on an approved list

## Policy model

```ts
interface RtePolicy {
  allowedElements: string[];
  restrictedElements: string[];
  allowedAttributes: Record<string, string[]>;
  allowRawHtml: boolean;
  allowCustomElements: boolean;
  allowHeadEditing: boolean;
  allowScripts: boolean;
  allowedUrlProtocols: string[];
}
```

## Principle

Sanitize on:
- paste
- import
- raw HTML insertion
- source editing
- plugin output
- serialization boundary where applicable
