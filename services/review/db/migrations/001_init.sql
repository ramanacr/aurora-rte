-- 001_init.sql: Initial schema for Aurora Comments & Review Service

CREATE TABLE IF NOT EXISTS comment_thread (
  tenant_id VARCHAR(64) NOT NULL,
  document_id VARCHAR(128) NOT NULL,
  id VARCHAR(64) PRIMARY KEY,
  anchor JSONB NOT NULL,
  messages JSONB NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS comment_thread_tenant_document 
  ON comment_thread (tenant_id, document_id);

CREATE INDEX IF NOT EXISTS comment_thread_tenant_resolved
  ON comment_thread (tenant_id, resolved);

CREATE TABLE IF NOT EXISTS review_audit_event (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  document_id VARCHAR(128) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS review_audit_tenant_doc
  ON review_audit_event (tenant_id, document_id, created_at DESC);
