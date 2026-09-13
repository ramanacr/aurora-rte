import { describe, it, expect } from 'vitest';
import {
  acceptSuggestion,
  rejectSuggestion,
  createSuggestion,
  type Actor,
  type Suggestion
} from '../src/suggestions.js';
import type { AuroraDocument } from '@aurora/model';

describe('Enterprise Suggestion Mode', () => {
  const actor: Actor = { id: 'reviewer-1', name: 'Carol Reviewer' };

  it('accepts an insertion suggestion and generates an immutable audit event', () => {
    const originalDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            {
              type: 'text',
              text: 'wonderful ',
              marks: [{ type: 'suggestion', attrs: { id: 'sugg-1', mode: 'insert' } }]
            },
            { type: 'text', text: 'world' }
          ]
        }
      ]
    };

    const result = acceptSuggestion(originalDoc, 'sugg-1', actor);

    // Document after acceptance should have 'wonderful ' without suggestion mark
    expect(result.document.format).toBe('aurora');
    const paragraph = result.document.content[0];
    const textNodes = paragraph.content || [];
    expect(textNodes.some((n) => n.text === 'wonderful ' && !n.marks?.some((m) => m.type === 'suggestion'))).toBe(true);

    // Audit event must be attached
    expect(result.auditEvent).toMatchObject({
      action: 'suggestion.accepted',
      actorId: actor.id,
      suggestionId: 'sugg-1'
    });
  });

  it('rejects an insertion suggestion by removing the proposed text', () => {
    const originalDoc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            {
              type: 'text',
              text: 'unwanted ',
              marks: [{ type: 'suggestion', attrs: { id: 'sugg-2', mode: 'insert' } }]
            },
            { type: 'text', text: 'world' }
          ]
        }
      ]
    };

    const result = rejectSuggestion(originalDoc, 'sugg-2', actor);

    expect(result.document.format).toBe('aurora');
    const paragraph = result.document.content[0];
    const textNodes = paragraph.content || [];
    expect(textNodes.some((n) => n.text?.includes('unwanted'))).toBe(false);

    expect(result.auditEvent).toMatchObject({
      action: 'suggestion.rejected',
      actorId: actor.id,
      suggestionId: 'sugg-2'
    });
  });
});
