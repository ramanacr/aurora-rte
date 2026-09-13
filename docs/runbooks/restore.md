# Enterprise Services Backup & Restore Runbook

This runbook defines the operational procedures for backup, verification, and disaster recovery of Aurora Enterprise services.

## 1. Backup Strategy

- **Database:** Automated continuous WAL archiving with daily full snapshots of PostgreSQL.
- **Tenancy Boundary:** Every table (`comment_thread`, `review_audit_event`) includes `tenant_id`.
- **Encryption:** Backups are encrypted at rest using AES-256.

## 2. Restore Procedure

### Step 1: Provision Clean Target Environment
Ensure the target database host or container is isolated from production traffic.

```bash
docker run --name aurora-postgres-restore -e POSTGRES_PASSWORD=securepass -d postgres:16
```

### Step 2: Apply Migrations
Execute ordered database migrations:

```bash
psql -h $TARGET_HOST -U $TARGET_USER -d aurora_db -f services/review/db/migrations/001_init.sql
```

### Step 3: Restore Data Snapshot
Restore data from encrypted dump:

```bash
pg_restore -h $TARGET_HOST -U $TARGET_USER -d aurora_db latest_backup.dump
```

### Step 4: Validate Tenant Isolation
Execute verification queries to ensure tenant data integrity:

```sql
SELECT tenant_id, count(*) FROM comment_thread GROUP BY tenant_id;
SELECT tenant_id, count(*) FROM review_audit_event GROUP BY tenant_id;
```

Confirm that cross-tenant indices are healthy:
```sql
REINDEX TABLE comment_thread;
```

### Step 5: Verify Health and Readiness Endpoints
Once gateway and services are started:

```bash
curl -f http://localhost:8080/healthz
curl -f http://localhost:8080/readyz
```
Expected output:
```json
{"status":"ok","version":"1.0.0"}
{"ready":true,"database":"connected"}
```
