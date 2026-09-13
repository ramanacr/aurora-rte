import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { importHtml, exportHtml } from '@aurora/editor';
import { validateDocument } from '@aurora/model';
import { cleanPastedHtml } from '@aurora/features';
import { globalExtensionRegistry } from '@aurora/extension-sdk';

const fixturesDir = path.resolve(import.meta.dirname, '../fixtures/security');

describe('Security Fixtures Verification', () => {
  it('neutralizes DOM clobbering vectors from HTML', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'dom-clobbering.html'), 'utf-8');
    const doc = importHtml(raw);
    const exported = exportHtml(doc);

    expect(exported).not.toContain('<form');
    expect(exported).not.toContain('clobbered_body');
    expect(exported).not.toContain('getElementById');
    expect(exported).toContain('Legitimate text inside DOM clobbering attempt');
  });

  it('safely handles and recovers from malformed table markup without crash', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'malformed-tables.html'), 'utf-8');
    const doc = importHtml(raw);
    expect(doc.format).toBe('aurora');
    const exported = exportHtml(doc);
    expect(exported).toContain('Post-table paragraph');
  });

  it('completely strips hostile SVG elements and embedded scripts', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'hostile-svg.html'), 'utf-8');
    const doc = importHtml(raw);
    const exported = exportHtml(doc);

    expect(exported).not.toContain('<svg');
    expect(exported).not.toContain('SVG Script Execution');
    expect(exported).not.toContain('xlink:href');
    expect(exported).not.toContain('SVG Animate');
    expect(exported).toContain('Safe content after SVG');
  });

  it('blocks obfuscated URL schemes including tabs, newlines, null bytes, and data URIs', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'obfuscated-schemes.html'), 'utf-8');
    const doc = importHtml(raw);
    const exported = exportHtml(doc);

    expect(exported).not.toContain('javascript:');
    expect(exported).not.toContain('vbscript:');
    expect(exported).not.toContain('file:');
    expect(exported).not.toContain('data:text/html');
    expect(exported).toContain('https://legitimate.org');
  });

  it('cleans copied Word markup and converts lists into clean semantic items', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'copied-word.html'), 'utf-8');
    const cleaned = cleanPastedHtml(raw);

    expect(cleaned).not.toContain('w:WordDocument');
    expect(cleaned).not.toContain('MsoNormal');
    expect(cleaned).not.toContain('mso-pagination');
    expect(cleaned).toContain('Executive Summary');
    expect(cleaned).toContain('<li>Item one from Word</li>');
  });

  it('verifies that unapproved extension content in documents can be validated or flagged', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'extension-mismatch.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    const doc = validateDocument(parsed);

    const customBlock = doc.content.find((n) => n.type === 'custom_block');
    expect(customBlock).toBeDefined();

    // Registry check: unknown extension is not registered
    const extId = customBlock?.attrs?.extensionId as string;
    expect(globalExtensionRegistry.has(extId)).toBe(false);
  });
});
