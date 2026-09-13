# Aurora Editor Quickstart

Embed Aurora Editor in any modern web environment in minutes.

## 1. Direct TypeScript / JavaScript

```ts
import { createEditor } from '@aurora/editor';
import { createToolbar } from '@aurora/ui';

const editor = createEditor({
  element: document.getElementById('editor'),
  document: {
    format: 'aurora',
    version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello Aurora' }] }]
  }
});

createToolbar({
  editor,
  container: document.getElementById('toolbar')
});
```

## 2. Web Component (Framework-Neutral)

```html
<script type="module" src="@aurora/web-component"></script>

<aurora-editor toolbar="true"></aurora-editor>

<script>
  const el = document.querySelector('aurora-editor');
  el.addEventListener('aurora-change', (e) => {
    console.log('Document updated:', e.detail.document);
  });
</script>
```

## 3. React

```tsx
import { AuroraEditor, useAuroraEditor } from '@aurora/react';

function App() {
  const handleChange = (change) => {
    console.log('Changed document:', change.document);
  };

  return <AuroraEditor toolbar={true} onChange={handleChange} />;
}
```

## 4. Angular

```typescript
import { Component } from '@angular/core';
import { AuroraEditorComponent } from '@aurora/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AuroraEditorComponent],
  template: `<aurora-editor [toolbar]="true" (docChange)="onDocChange($event)"></aurora-editor>`
})
export class AppComponent {
  onDocChange(change) {
    console.log('Document updated', change.document);
  }
}
```
