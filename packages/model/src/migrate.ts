import { AuroraDocument, CURRENT_DOCUMENT_VERSION } from './document.js';
import { validateDocument } from './validate.js';

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

export interface DocumentMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (doc: AuroraDocument) => AuroraDocument;
}

const migrationRegistry: DocumentMigration[] = [];

/**
 * Registers a version-to-version migration transform.
 */
export function registerMigration(migration: DocumentMigration): void {
  // Check if identical step already registered
  const existingIdx = migrationRegistry.findIndex(
    m => m.fromVersion === migration.fromVersion && m.toVersion === migration.toVersion
  );
  if (existingIdx >= 0) {
    migrationRegistry[existingIdx] = migration;
  } else {
    migrationRegistry.push(migration);
  }
}

/**
 * Migrates an AuroraDocument from its current version to targetVersion
 * using registered migration steps.
 */
export function migrateDocument(
  input: unknown,
  targetVersion: number = CURRENT_DOCUMENT_VERSION
): AuroraDocument {
  // First, validate structure as much as possible for current version
  let currentDoc = input as AuroraDocument;

  if (!currentDoc || typeof currentDoc !== 'object' || typeof currentDoc.version !== 'number') {
    throw new MigrationError('Cannot migrate document without valid version');
  }

  if (currentDoc.version === targetVersion) {
    return validateDocument(currentDoc);
  }

  if (currentDoc.version > targetVersion) {
    throw new MigrationError(
      `Downgrading document from version ${currentDoc.version} to ${targetVersion} is not supported`
    );
  }

  let safetyCounter = 0;
  while (currentDoc.version < targetVersion) {
    safetyCounter++;
    if (safetyCounter > 100) {
      throw new MigrationError('Migration cycle detected or exceeded max steps');
    }

    const step = migrationRegistry.find(m => m.fromVersion === currentDoc.version);
    if (!step) {
      throw new MigrationError(
        `No migration path available from version ${currentDoc.version} to ${targetVersion}`
      );
    }

    currentDoc = step.migrate(currentDoc);
  }

  return validateDocument(currentDoc);
}
