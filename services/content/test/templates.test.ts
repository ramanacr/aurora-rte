import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTemplate,
  listTemplates,
  createRevision,
  listRevisions,
  clearContentStoreForTest
} from '../src/templates.js';
import type { AuroraDocument } from '@aurora/model';

const sampleDoc: AuroraDocument = {
  format: 'aurora',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Template content' }] }]
};

describe('Content Service Templates & Revisions', () => {
  beforeEach(() => {
    clearContentStoreForTest();
  });

  it('manages versioned templates with tenant isolation', async () => {
    const tpl = await createTemplate('tenant-acme', 'NDA Form', 'legal', sampleDoc);
    expect(tpl.id).toBeDefined();
    expect(tpl.title).toBe('NDA Form');

    const acmeList = await listTemplates('tenant-acme');
    expect(acmeList.length).toBe(1);

    const otherList = await listTemplates('tenant-other');
    expect(otherList.length).toBe(0);
  });

  it('tracks sequential revisions for a document', async () => {
    const r1 = await createRevision('tenant-acme', 'doc-1', sampleDoc, 'author-1', 'Initial commit');
    expect(r1.revisionNumber).toBe(1);

    const r2 = await createRevision('tenant-acme', 'doc-1', sampleDoc, 'author-2', 'Second revision');
    expect(r2.revisionNumber).toBe(2);

    const history = await listRevisions('tenant-acme', 'doc-1');
    expect(history.length).toBe(2);
    expect(history[0].revisionNumber).toBe(2); // Sorted newest first
  });
});
