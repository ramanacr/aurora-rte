import { describe, it, expect } from 'vitest';
import { getHealth, getReadiness } from '../../services/gateway/src/server.js';
import { authorize } from '../../services/gateway/src/auth.js';
import { createComment, listComments, asTenant } from '../../services/review/src/comments.js';
import { createTemplate, listTemplates } from '../../services/content/src/templates.js';

describe('Self-Hosted Deployment Endpoints & Security', () => {
  it('exposes health and readiness endpoints', () => {
    const health = getHealth();
    expect(health.status).toBe('ok');
    expect(health.version).toBe('1.0.0');
    expect(typeof health.uptime).toBe('number');

    const readiness = getReadiness(true);
    expect(readiness.ready).toBe(true);
    expect(readiness.database).toBe('connected');

    const degraded = getReadiness(false);
    expect(degraded.ready).toBe(false);
    expect(degraded.database).toBe('disconnected');
  });

  it('enforces end-to-end tenant authentication and cross-service data isolation', async () => {
    // 1. Gateway authorizes tenant
    const authA = authorize({ sub: 'user-1', tid: 'tenant-hosted-1' }, 'tenant-hosted-1');
    expect(authA.allowed).toBe(true);

    const authB = authorize({ sub: 'user-2', tid: 'tenant-hosted-2' }, 'tenant-hosted-1');
    expect(authB.allowed).toBe(false);

    // 2. Review service stores comment for tenant-hosted-1
    await createComment(asTenant('tenant-hosted-1'), 'doc-self-1', {
      anchor: { from: 0, to: 10 },
      message: 'Self-hosted comment'
    });

    const tenant1Comments = await listComments(asTenant('tenant-hosted-1'), 'doc-self-1');
    expect(tenant1Comments.length).toBeGreaterThan(0);

    const tenant2Comments = await listComments(asTenant('tenant-hosted-2'), 'doc-self-1');
    expect(tenant2Comments).toEqual([]);

    // 3. Content service stores template for tenant-hosted-1
    await createTemplate('tenant-hosted-1', 'Self-hosted standard', 'ops', {
      format: 'aurora',
      version: 1,
      content: [{ type: 'paragraph' }]
    });

    const tenant1Templates = await listTemplates('tenant-hosted-1');
    expect(tenant1Templates.length).toBe(1);

    const tenant2Templates = await listTemplates('tenant-hosted-2');
    expect(tenant2Templates.length).toBe(0);
  });
});
