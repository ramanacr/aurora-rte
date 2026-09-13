import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateDocument, serializeDocument } from '../src/index.js';
import type { AuroraDocument, AuroraNode } from '../src/document.js';

describe('Model Property Tests', () => {
  const arbitraryTextNode = fc.string().map(
    (text): AuroraNode => ({
      type: 'text',
      text
    })
  );

  const arbitraryParagraph = fc.array(arbitraryTextNode, { maxLength: 10 }).map(
    (content): AuroraNode => ({
      type: 'paragraph',
      content
    })
  );

  const arbitraryDocument = fc
    .tuple(
      fc.array(arbitraryParagraph, { maxLength: 20 }),
      fc.dictionary(fc.string(), fc.string())
    )
    .map(([content, meta]): AuroraDocument => ({
      format: 'aurora',
      version: 1,
      content,
      meta
    }));

  it('preserves valid documents deterministically under serialization', () => {
    fc.assert(
      fc.property(arbitraryDocument, (doc) => {
        const validated = validateDocument(doc);
        const serialized1 = serializeDocument(validated);
        const serialized2 = serializeDocument(validated);
        expect(serialized1).toBe(serialized2);

        const parsed = JSON.parse(serialized1);
        const roundTrip = validateDocument(parsed);
        expect(serializeDocument(roundTrip)).toBe(serialized1);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects documents with invalid formats or non-positive versions', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'aurora'),
        fc.integer({ max: 0 }),
        (badFormat, badVersion) => {
          expect(() =>
            validateDocument({ format: badFormat, version: 1, content: [] })
          ).toThrow();
          expect(() =>
            validateDocument({ format: 'aurora', version: badVersion, content: [] })
          ).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });
});
