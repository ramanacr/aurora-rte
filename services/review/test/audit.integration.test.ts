import { describe, it, expect, beforeEach } from 'vitest';
import { recordAuditEvent, listAuditEvents, clearAuditStoreForTest } from '../src/audit.js';

describe('Audit Event Integration and Tenant Scoping', () => {
  beforeEach(() => {
    clearAuditStoreForTest();
  });

  it('records immutable audit events and redacts confidential body data', async () => {
    const event = await recordAuditEvent('tenant-corp', 'doc-999', 'user-42', 'suggestion.accepted', {
      suggestionId: 'sugg-1',
      token: 'secret-token',
      content: { secret: true }
    });

    expect(event.id).toBeDefined();
    expect(event.tenantId).toBe('tenant-corp');
    expect(event.payload.suggestionId).toBe('sugg-1');
    expect(event.payload.token).toBeUndefined();
    expect(event.payload.content).toBe('[REDACTED_CONTENT]');

    const logs = await listAuditEvents('tenant-corp', 'doc-999');
    expect(logs.length).toBe(1);

    // Isolated from other tenants
    const foreignLogs = await listAuditEvents('tenant-other', 'doc-999');
    expect(foreignLogs).toEqual([]);
  });
});
