import { describe, it, expect } from 'vitest';
import { migrateDocument, registerMigration, MigrationError } from '../src/migrate.js';
import type { AuroraDocument } from '../src/document.js';

describe('migrateDocument', () => {
  it('returns document unchanged if already at target version', () => {
    const doc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }]
    };
    const migrated = migrateDocument(doc, 1);
    expect(migrated).toEqual(doc);
  });

  it('migrates from v1 to v2 schema using registered migrations', () => {
    // Register test migration v1 -> v2
    registerMigration({
      fromVersion: 1,
      toVersion: 2,
      migrate: (doc: any) => {
        return {
          ...doc,
          version: 2,
          meta: {
            ...doc.meta,
            migratedAt: '2026-09-13'
          }
        };
      }
    });

    const v1Doc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }]
    };

    const v2Doc = migrateDocument(v1Doc, 2);
    expect(v2Doc.version).toBe(2);
    expect((v2Doc.meta as any)?.migratedAt).toBe('2026-09-13');
  });

  it('throws when no migration path exists', () => {
    const doc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: []
    };
    expect(() => migrateDocument(doc, 99)).toThrow(MigrationError);
  });
});
