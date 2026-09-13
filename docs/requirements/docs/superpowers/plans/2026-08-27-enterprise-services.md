# Aurora Enterprise Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver optional review, template, version, identity, audit, and operational services with managed-cloud/self-hosted API parity.

**Architecture:** Enterprise services are additive and tenant-scoped. The core talks to them only through public host adapters; self-hosted and managed deployments expose identical versioned APIs.

**Tech Stack:** TypeScript service contracts, PostgreSQL, OpenAPI, OIDC/SAML provider integration, OpenTelemetry, container images, Playwright/API tests.

**Spec:** `docs/superpowers/specs/2026-08-27-rich-text-editor-design.md`

## Global Constraints

- No enterprise package may be a core dependency.
- Enforce tenant identity and authorization on every read/write.
- Log redacted structured events; retain immutable audit records.
- Deploy equivalently in managed and self-hosted modes.

---

### Task 1: Establish tenant-scoped service contract and persistence

**Files:**
- Create: `services/review/openapi.yaml`, `services/review/src/comments.ts`, `services/review/db/migrations/001_init.sql`
- Test: `services/review/test/comments.integration.test.ts`

**Interfaces:** Produces `POST /v1/documents/{id}/comments`, `GET /v1/documents/{id}/comments`, and tenant-bound `CommentThread`.

- [ ] **Step 1: Write a failing isolation test**

```ts
await createComment(asTenant('a'), documentId, request);
await expect(listComments(asTenant('b'), documentId)).resolves.toEqual([]);
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @aurora/review-service test comments.integration.test.ts`  
Expected: FAIL because service and schema are absent.

- [ ] **Step 3: Implement tenant-scoped schema and authorization**

```sql
create table comment_thread (tenant_id uuid not null, document_id text not null, id uuid primary key, anchor jsonb not null, body jsonb not null);
create index comment_thread_tenant_document on comment_thread (tenant_id, document_id);
```

- [ ] **Step 4: Run integration and migration tests**

Run: `pnpm --filter @aurora/review-service test && pnpm db:migrate:test`  
Expected: PASS; cross-tenant reads/writes return no data or 403 by policy.

- [ ] **Step 5: Commit**

Run: `git add services/review && git commit -m "feat(enterprise): add tenant-isolated comments service"`

### Task 2: Add suggestion mode, audit, templates, and revisions

**Files:**
- Create: `packages/enterprise-review/src/suggestions.ts`, `services/review/src/audit.ts`, `services/content/src/templates.ts`
- Test: `packages/enterprise-review/test/suggestions.test.ts`, `services/review/test/audit.integration.test.ts`

**Interfaces:** Consumes public editor extension SDK; produces `Suggestion`, `acceptSuggestion`, `rejectSuggestion`, immutable `AuditEvent`, and versioned templates.

- [ ] **Step 1: Write failing suggestion/audit test**

```ts
const accepted = acceptSuggestion(document, suggestionId, actor);
expect(accepted.document).toEqual(expectedDocument);
expect(auditEvents[0]).toMatchObject({ action: 'suggestion.accepted', actorId: actor.id });
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @aurora/enterprise-review test suggestions.test.ts`  
Expected: FAIL because suggestion module is missing.

- [ ] **Step 3: Implement additive review extension and audit append**

```ts
export function acceptSuggestion(document: AuroraDocument, id: string, actor: Actor): AcceptanceResult { /* validate, transform, append audit */ }
```

- [ ] **Step 4: Run service/API/authorization tests**

Run: `pnpm test:enterprise && pnpm openapi:check`  
Expected: PASS; every mutation has an immutable tenant-scoped audit event.

- [ ] **Step 5: Commit**

Run: `git add packages/enterprise-review services && git commit -m "feat(enterprise): add governed suggestions and revisions"`

### Task 3: Deliver deployment, identity, observability, and recovery

**Files:**
- Create: `deploy/helm/`, `services/gateway/src/auth.ts`, `docs/runbooks/restore.md`, `tests/e2e/self-hosted.spec.ts`
- Test: `services/gateway/test/auth.test.ts`, `tests/e2e/self-hosted.spec.ts`

**Interfaces:** Produces OIDC/SAML-aware gateway, health/readiness endpoints, redacted telemetry, upgrade and restore runbooks, and Helm deployment.

- [ ] **Step 1: Write failing tenant-claim test**

```ts
expect(authorize({ sub: 'u1' }, 'tenant-a')).toEqual({ allowed: false, reason: 'missing tenant claim' });
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @aurora/gateway test auth.test.ts`  
Expected: FAIL because authorization policy is absent.

- [ ] **Step 3: Implement claim validation and redacted observability**

```ts
export function authorize(claims: Claims, tenantId: string): AuthorizationResult { return hasTenantClaim(claims, tenantId) ? allowed() : denied('missing tenant claim'); }
```

- [ ] **Step 4: Run container, self-hosted, backup, and restore tests**

Run: `pnpm test:e2e -- tests/e2e/self-hosted.spec.ts && pnpm backup:restore:test && helm lint deploy/helm`  
Expected: PASS; a restored environment serves authorized tenant data with no document bodies in logs.

- [ ] **Step 5: Commit**

Run: `git add deploy services docs/runbooks tests && git commit -m "feat(enterprise): add deployable governed services"`
