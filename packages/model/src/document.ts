/**
 * Aurora Document Model Types
 *
 * Canonical representation of rich-text content in Aurora Editor.
 * Persisted format is always { format: 'aurora', version: number, content: AuroraNode[] }.
 */

export interface AuroraMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface AuroraNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: AuroraNode[];
  marks?: AuroraMark[];
  text?: string;
}

export interface AuroraDocument {
  format: 'aurora';
  version: number;
  content: AuroraNode[];
  meta?: Record<string, unknown>;
}

export interface JsonPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: unknown;
  from?: string;
}

export interface ValidationLimits {
  maxDepth?: number;
  maxNodes?: number;
  maxTextLength?: number;
  maxTableRows?: number;
  maxTableCols?: number;
}

export const DEFAULT_LIMITS: Required<ValidationLimits> = {
  maxDepth: 64,
  maxNodes: 50000,
  maxTextLength: 5000000,
  maxTableRows: 500,
  maxTableCols: 100
};

export const CURRENT_DOCUMENT_VERSION = 1;
