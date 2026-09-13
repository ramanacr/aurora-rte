import type { AuroraDocument } from '@aurora/model';
import { validateDocument } from '@aurora/model';

export interface Template {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  document: AuroraDocument;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRevision {
  id: string;
  tenantId: string;
  documentId: string;
  revisionNumber: number;
  document: AuroraDocument;
  authorId: string;
  summary?: string;
  createdAt: string;
}

const templateStore = new Map<string, Template>();
const revisionStore: DocumentRevision[] = [];

export function clearContentStoreForTest(): void {
  templateStore.clear();
  revisionStore.length = 0;
}

export async function createTemplate(
  tenantId: string,
  title: string,
  category: string,
  document: AuroraDocument
): Promise<Template> {
  const validated = validateDocument(document);
  const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const template: Template = {
    id,
    tenantId,
    title,
    category,
    document: validated,
    version: 1,
    createdAt: now,
    updatedAt: now
  };

  templateStore.set(id, template);
  return template;
}

export async function listTemplates(tenantId: string, category?: string): Promise<Template[]> {
  const results: Template[] = [];
  for (const tpl of templateStore.values()) {
    if (tpl.tenantId === tenantId) {
      if (!category || tpl.category === category) {
        results.push(tpl);
      }
    }
  }
  return results;
}

export async function createRevision(
  tenantId: string,
  documentId: string,
  document: AuroraDocument,
  authorId: string,
  summary?: string
): Promise<DocumentRevision> {
  const validated = validateDocument(document);
  const existing = revisionStore.filter((r) => r.tenantId === tenantId && r.documentId === documentId);
  const revisionNumber = existing.length + 1;

  const rev: DocumentRevision = {
    id: `rev_${documentId}_${revisionNumber}`,
    tenantId,
    documentId,
    revisionNumber,
    document: validated,
    authorId,
    summary,
    createdAt: new Date().toISOString()
  };

  revisionStore.push(rev);
  return rev;
}

export async function listRevisions(tenantId: string, documentId: string): Promise<DocumentRevision[]> {
  return revisionStore
    .filter((r) => r.tenantId === tenantId && r.documentId === documentId)
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}
