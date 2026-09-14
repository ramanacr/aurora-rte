// @vitest-environment happy-dom
import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { ElementRef } from '@angular/core';
import { AuroraEditorComponent } from '../src/editor.component.js';
import { HtmlAuthoringService } from '../src/html-authoring/authoring.service.js';
import type { AuroraDocument } from '@aurora/model';

const testDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello HTML Authoring' }] }]
};

describe('Angular HTML Authoring Integration', () => {
  it('initializes HtmlAuthoringService, registry, and exposes authoring actions', () => {
    const service = new HtmlAuthoringService();
    const registry = service.getRegistry();
    expect(registry.getAll().length).toBeGreaterThanOrEqual(40);

    const component = new AuroraEditorComponent(service);
    const editorDiv = document.createElement('div');
    component.editorMountRef = new ElementRef(editorDiv);
    component.document = testDoc;
    component.toolbar = false;

    component.ngOnInit();

    expect(service.getEditor()).toBeDefined();

    // Verify element availability evaluation
    const pDef = registry.get('p')!;
    const avail = service.evaluateElement(pDef);
    expect(avail.allowed).toBe(true);
    expect(avail.score).toBeGreaterThan(0);

    // Test opening and closing Element Picker
    component.openElementPicker();
    expect(service.isElementPickerOpen).toBe(true);
    service.isElementPickerOpen = false;

    // Test opening Command Palette
    component.openCommandPalette();
    expect(service.isCommandPaletteOpen).toBe(true);
    service.isCommandPaletteOpen = false;

    // Test element inspection and a11y auto-fix
    const imgElem = document.createElement('img');
    imgElem.src = 'https://example.com/test.png';
    const auditData = service.inspect(imgElem);
    expect(auditData.tagName).toBe('img');
    expect(auditData.accessibilityIssues.length).toBeGreaterThan(0);

    // Auto-fix missing alt
    const fixResult = service.applyFix(auditData.accessibilityIssues[0]);
    expect(fixResult).toBe(true);
    expect(imgElem.hasAttribute('alt')).toBe(true);

    component.ngOnDestroy();
  });
});
