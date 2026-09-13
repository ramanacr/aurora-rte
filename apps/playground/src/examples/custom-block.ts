import { defineCustomBlock, createCustomBlockNode, type CustomBlockDefinition } from '@aurora/extension-sdk';
import type { AuroraEditor } from '@aurora/editor';

export interface CalloutData {
  type: 'info' | 'warning' | 'tip';
  title: string;
  message: string;
}

export const calloutBlock: CustomBlockDefinition<CalloutData> = defineCustomBlock<CalloutData>({
  extensionId: '@aurora-community/callout',
  validateData: (data: unknown): data is CalloutData => {
    const d = data as Partial<CalloutData>;
    return (
      typeof d === 'object' &&
      d !== null &&
      ['info', 'warning', 'tip'].includes(String(d.type)) &&
      typeof d.title === 'string' &&
      typeof d.message === 'string'
    );
  },
  fallbackText: (data: CalloutData) => `[${data.type.toUpperCase()}] ${data.title}: ${data.message}`,
  renderEditable: (data: CalloutData, _onUpdate) => {
    const el = document.createElement('div');
    el.className = `aurora-callout aurora-callout-${data.type}`;
    el.style.cssText = 'padding: 12px; border-left: 4px solid var(--aurora-primary, #28E6F5); background: var(--aurora-muted-bg, #0b204c); border-radius: 4px; margin: 8px 0;';

    const titleEl = document.createElement('strong');
    titleEl.textContent = data.title;
    titleEl.style.display = 'block';

    const msgEl = document.createElement('p');
    msgEl.textContent = data.message;
    msgEl.style.margin = '4px 0 0 0';

    el.appendChild(titleEl);
    el.appendChild(msgEl);
    return el;
  },
  renderReadOnly: (data: CalloutData) => {
    return `<div class="callout callout-${data.type}"><strong>${data.title}</strong><p>${data.message}</p></div>`;
  },
  toHtml: (data: CalloutData) => {
    return `<aside class="callout callout-${data.type}"><h4>${data.title}</h4><p>${data.message}</p></aside>`;
  },
  toMarkdown: (data: CalloutData) => {
    return `> [!${data.type.toUpperCase()}]\n> **${data.title}**\n> ${data.message}\n\n`;
  }
});

export function insertSampleCallout(editor: AuroraEditor) {
  const node = createCustomBlockNode('@aurora-community/callout', {
    type: 'tip',
    title: 'Pro Tip',
    message: 'Custom blocks preserve their state cleanly inside Aurora Documents.'
  });
  return editor.execute('insertCustomBlock', node.attrs);
}
