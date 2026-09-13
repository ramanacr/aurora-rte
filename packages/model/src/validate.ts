import {
  AuroraDocument,
  AuroraNode,
  ValidationLimits,
  DEFAULT_LIMITS
} from './document.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates untrusted input as a safe, canonical AuroraDocument.
 * Enforces format === 'aurora', positive integer version, array content,
 * recursion depth limits, total node counts, string lengths, and table dimensions.
 */
export function validateDocument(
  input: unknown,
  limits?: ValidationLimits
): AuroraDocument {
  const mergedLimits: Required<ValidationLimits> = {
    maxDepth: limits?.maxDepth ?? DEFAULT_LIMITS.maxDepth,
    maxNodes: limits?.maxNodes ?? DEFAULT_LIMITS.maxNodes,
    maxTextLength: limits?.maxTextLength ?? DEFAULT_LIMITS.maxTextLength,
    maxTableRows: limits?.maxTableRows ?? DEFAULT_LIMITS.maxTableRows,
    maxTableCols: limits?.maxTableCols ?? DEFAULT_LIMITS.maxTableCols
  };

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Document must be a non-null object');
  }

  const doc = input as Partial<AuroraDocument>;

  if (doc.format !== 'aurora') {
    throw new ValidationError(`Invalid format "${String(doc.format)}", must be "aurora"`);
  }

  if (
    typeof doc.version !== 'number' ||
    !Number.isInteger(doc.version) ||
    doc.version <= 0
  ) {
    throw new ValidationError(
      `Invalid version "${String(doc.version)}", must be a positive integer`
    );
  }

  if (!Array.isArray(doc.content)) {
    throw new ValidationError('Document content must be an array');
  }

  let totalNodes = 0;
  let totalTextLength = 0;

  function validateNode(node: unknown, depth: number): AuroraNode {
    if (depth > mergedLimits.maxDepth) {
      throw new ValidationError(
        `Document exceeded maximum nesting depth of ${mergedLimits.maxDepth}`
      );
    }

    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw new ValidationError('Node must be a non-null object');
    }

    totalNodes++;
    if (totalNodes > mergedLimits.maxNodes) {
      throw new ValidationError(
        `Document exceeded maximum node limit of ${mergedLimits.maxNodes}`
      );
    }

    const n = node as Partial<AuroraNode>;
    if (typeof n.type !== 'string' || !n.type.trim()) {
      throw new ValidationError('Node must have a valid string type');
    }

    // Check table limits if table node
    if (n.type === 'table' && n.attrs) {
      const rows = typeof n.attrs.rows === 'number' ? n.attrs.rows : 0;
      const cols = typeof n.attrs.cols === 'number' ? n.attrs.cols : 0;
      if (rows > mergedLimits.maxTableRows || cols > mergedLimits.maxTableCols) {
        throw new ValidationError(
          `Table size exceeds limit: rows ${rows} (max ${mergedLimits.maxTableRows}), cols ${cols} (max ${mergedLimits.maxTableCols})`
        );
      }
    }

    // Validate text node
    if (n.type === 'text') {
      if (typeof n.text !== 'string') {
        throw new ValidationError('Text node must contain string text');
      }
      totalTextLength += n.text.length;
      if (totalTextLength > mergedLimits.maxTextLength) {
        throw new ValidationError(
          `Document exceeded maximum text length of ${mergedLimits.maxTextLength}`
        );
      }
    }

    // Validate child content
    if (n.content !== undefined) {
      if (!Array.isArray(n.content)) {
        throw new ValidationError(`Node "${n.type}" content must be an array`);
      }
      for (const child of n.content) {
        validateNode(child, depth + 1);
      }
    }

    // Validate marks
    if (n.marks !== undefined) {
      if (!Array.isArray(n.marks)) {
        throw new ValidationError(`Node "${n.type}" marks must be an array`);
      }
      for (const mark of n.marks) {
        if (!mark || typeof mark !== 'object' || typeof mark.type !== 'string') {
          throw new ValidationError('Mark must be an object with string type');
        }
      }
    }

    return n as AuroraNode;
  }

  for (const rootNode of doc.content) {
    validateNode(rootNode, 1);
  }

  return {
    format: 'aurora',
    version: doc.version,
    content: doc.content as AuroraNode[],
    ...(doc.meta ? { meta: { ...doc.meta } } : {})
  };
}
