export interface ServiceAuditEvent {
  id: string;
  tenantId: string;
  documentId: string;
  actorId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const auditLogStore: ServiceAuditEvent[] = [];

export function clearAuditStoreForTest(): void {
  auditLogStore.length = 0;
}

/**
 * Appends an immutable, tenant-scoped audit event.
 * Enforces redaction of sensitive body content before persisting.
 */
export async function recordAuditEvent(
  tenantId: string,
  documentId: string,
  actorId: string,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<ServiceAuditEvent> {
  if (!tenantId || !documentId || !actorId || !action) {
    throw new Error('Tenant, document, actor, and action are required for audit logging');
  }

  // Redact any raw document content or password fields to preserve confidentiality
  const redactedPayload = { ...payload };
  delete (redactedPayload as any).password;
  delete (redactedPayload as any).token;
  if ((redactedPayload as any).content) {
    (redactedPayload as any).content = '[REDACTED_CONTENT]';
  }

  const event: ServiceAuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId,
    documentId,
    actorId,
    action,
    payload: redactedPayload,
    createdAt: new Date().toISOString()
  };

  auditLogStore.push(event);
  return event;
}

export async function listAuditEvents(
  tenantId: string,
  documentId: string
): Promise<ServiceAuditEvent[]> {
  return auditLogStore
    .filter((e) => e.tenantId === tenantId && e.documentId === documentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
