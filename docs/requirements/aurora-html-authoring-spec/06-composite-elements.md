# Composite Element Templates

Composite elements must generate valid, useful structures rather than empty tags.

## Template model

```ts
export interface ElementTemplate {
  id: string;
  rootTag: string;
  displayName: string;
  requiredChildren?: string[];
  defaultChildren?: TemplateNode[];
  configurationSchema?: string;
  supportsNestedEditing: boolean;
}

export interface TemplateNode {
  tag: string;
  text?: string;
  attributes?: Record<string, string>;
  children?: TemplateNode[];
}
```

## Examples

### Section

```html
<section>
  <h2>Section heading</h2>
  <p>Start writing...</p>
</section>
```

### Details

```html
<details>
  <summary>Click to expand</summary>
  <p>Content...</p>
</details>
```

### Figure

```html
<figure>
  <img src="" alt="">
  <figcaption>Caption</figcaption>
</figure>
```

### Form field

```html
<div class="form-field">
  <label for="field-id">Label</label>
  <input id="field-id" type="text">
</div>
```

## Composite rules

- Required children are auto-created
- Child nodes remain editable
- Root node is treated as one logical component
- Configuration updates must preserve valid structure
- Deletion should offer “delete component” versus “unwrap contents” where applicable
