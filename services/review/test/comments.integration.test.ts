import { describe, it, expect, beforeEach } from 'vitest';
import {
  createComment,
  listComments,
  resolveCommentThread,
  asTenant,
  clearAllStoresForTest
} from '../src/comments.js';

describe('Tenant-Scoped Comments Service', () => {
  beforeEach(() => {
    clearAllStoresForTest();
  });

  it('strictly isolates comment threads between different tenants', async () => {
    const documentId = 'doc-123';
    const request = {
      anchor: { from: 10, to: 25, textSnippet: 'important section' },
      message: 'Please review this sentence.',
      author: { id: 'user-1', name: 'Alice' }
    };

    // Tenant A creates a comment
    const created = await createComment(asTenant('tenant-a'), documentId, request);
    expect(created.id).toBeDefined();
    expect(created.tenantId).toBe('tenant-a');
    expect(created.documentId).toBe(documentId);

    // Tenant A sees the comment
    const listA = await listComments(asTenant('tenant-a'), documentId);
    expect(listA.length).toBe(1);
    expect(listA[0].id).toBe(created.id);

    // Tenant B cannot see Tenant A's comment
    await expect(listComments(asTenant('tenant-b'), documentId)).resolves.toEqual([]);
  });

  it('resolves comment threads within tenant context only', async () => {
    const documentId = 'doc-xyz';
    const created = await createComment(asTenant('tenant-1'), documentId, {
      anchor: { from: 0, to: 5 },
      message: 'Typo here'
    });

    // Tenant 2 cannot resolve Tenant 1's comment
    await expect(resolveCommentThread(asTenant('tenant-2'), created.id)).rejects.toThrow(/not found/i);

    // Tenant 1 resolves it
    const resolved = await resolveCommentThread(asTenant('tenant-1'), created.id);
    expect(resolved.resolved).toBe(true);
  });
});
