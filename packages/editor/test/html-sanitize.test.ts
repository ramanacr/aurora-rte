import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { importHtml, exportHtml } from '../src/html.js';

describe('HTML Sanitization and Import/Export', () => {
  it('drops executable markup while retaining approved content', () => {
    const document = importHtml('<p>Hello</p><img src="x" onerror="alert(1)">');
    const exported = exportHtml(document);
    expect(exported).toContain('<p>Hello</p>');
    expect(exported).toContain('<img src="x"');
    expect(exported).not.toContain('onerror');
    expect(exported).not.toContain('alert(1)');
  });

  it('sanitizes hostile HTML fixture removing scripts, iframes, and javascript: links', () => {
    const fixturePath = path.resolve(import.meta.dirname, '../../../tests/fixtures/html/hostile.html');
    const rawHtml = fs.readFileSync(fixturePath, 'utf-8');

    const doc = importHtml(rawHtml);
    const exported = exportHtml(doc);

    // Hostile vectors must be stripped
    expect(exported).not.toContain('<script');
    expect(exported).not.toContain('<iframe');
    expect(exported).not.toContain('javascript:');
    expect(exported).not.toContain('onerror=');
    expect(exported).not.toContain('onload=');
    expect(exported).not.toContain('<form');
    expect(exported).not.toContain('<input');
    expect(exported).not.toContain('data:text/html');

    // Approved content must remain
    expect(exported).toContain('Safe Title');
    expect(exported).toContain('Safe paragraph');
    expect(exported).toContain('https://example.com');
    expect(exported).toContain('Approved text');
    expect(exported).toContain('<strong>with bold</strong>');
    expect(exported).toContain('<em>italic</em>');
  });

  it('normalizes safe URLs and disallows unsafe schemes', () => {
    const doc = importHtml('<p><a href="javascript:void(0)">x</a><a href="vbscript:msgbox">y</a><a href="https://aurora.dev">ok</a></p>');
    const exported = exportHtml(doc);
    expect(exported).not.toContain('javascript:');
    expect(exported).not.toContain('vbscript:');
    expect(exported).toContain('https://aurora.dev');
  });
});
