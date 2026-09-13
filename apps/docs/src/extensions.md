# Extension SDK & Custom Blocks

Extend Aurora Editor safely with custom node schemas, blocks, and toolbars.

## Creating a Custom Block

```ts
import { defineCustomBlock, createCustomBlockNode } from '@aurora/extension-sdk';

interface PollData {
  question: string;
  options: string[];
}

export const pollBlock = defineCustomBlock<PollData>({
  extensionId: '@myorg/poll',
  validateData: (data): data is PollData => {
    return typeof (data as any)?.question === 'string';
  },
  fallbackText: (data) => `[Poll: ${data.question}]`,
  renderEditable: (data, onUpdate) => {
    const el = document.createElement('div');
    el.innerHTML = `<h4>Poll: ${data.question}</h4>`;
    return el;
  },
  renderReadOnly: (data) => {
    return `<div><h4>${data.question}</h4></div>`;
  }
});
```

## Registering Extensions

```ts
import { ExtensionRegistry } from '@aurora/extension-sdk';

const registry = new ExtensionRegistry();
registry.register({
  id: '@myorg/poll',
  version: '1.0.0',
  title: 'Interactive Poll'
});
```
