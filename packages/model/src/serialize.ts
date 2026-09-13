import { AuroraDocument } from './document.js';
import { validateDocument } from './validate.js';

/**
 * Deterministically sorts object keys recursively to produce canonical JSON.
 */
function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) {
    if (obj[k] !== undefined) {
      sorted[k] = sortKeys(obj[k]);
    }
  }
  return sorted;
}

/**
 * Canonical JSON serializer for Aurora documents.
 * Guarantees that any two equivalent documents produce byte-for-byte identical output.
 */
export function serializeDocument(doc: AuroraDocument, space?: number): string {
  const validated = validateDocument(doc);
  const canonical = sortKeys(validated);
  return JSON.stringify(canonical, null, space);
}
