// @vitest-environment happy-dom
import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { ElementRef } from '@angular/core';
import { AuroraEditorComponent } from '../src/editor.component.js';
import type { AuroraDocument } from '@aurora/model';

const initialDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Angular Test' }] }]
};

describe('Angular AuroraEditorComponent Bridge', () => {
  it('instantiates and emits events with valid Aurora format and ControlValueAccessor support', () => {
    const component = new AuroraEditorComponent();
    const editorDiv = document.createElement('div');
    component.editorMountRef = new ElementRef(editorDiv);
    component.document = initialDoc;
    component.toolbar = false;

    const docChangeSpy = vi.fn();
    component.docChange.subscribe(docChangeSpy);

    component.ngOnInit();

    expect(component.getDocument()?.format).toBe('aurora');
    expect(component.getDocument()?.content[0].content?.[0].text).toBe('Angular Test');

    // Test ControlValueAccessor writeValue
    const updatedDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated via writeValue' }] }]
    };
    component.writeValue(updatedDoc);
    expect(component.getDocument()?.content[0].content?.[0].text).toBe('Updated via writeValue');

    // Test command execution
    component.execute('insertText', { text: ' appended' });
    expect(docChangeSpy).toHaveBeenCalled();
    const emitted = docChangeSpy.mock.calls[0][0];
    expect(emitted.document.format).toBe('aurora');

    component.ngOnDestroy();
  });
});
