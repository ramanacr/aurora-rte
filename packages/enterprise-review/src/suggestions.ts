import type { AuroraDocument, AuroraNode } from '@aurora/model';
import { validateDocument } from '@aurora/model';

export type SuggestionMode = 'insert' | 'delete' | 'replace';

export interface Actor {
  id: string;
  name: string;
  email?: string;
}

export interface Suggestion {
  id: string;
  mode: SuggestionMode;
  author: Actor;
  createdAt: string;
  originalText?: string;
  suggestedText?: string;
}

export interface AuditEvent {
  id: string;
  action: 'suggestion.accepted' | 'suggestion.rejected' | 'suggestion.created';
  suggestionId: string;
  actorId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface AcceptanceResult {
  document: AuroraDocument;
  auditEvent: AuditEvent;
}

export interface RejectionResult {
  document: AuroraDocument;
  auditEvent: AuditEvent;
}

export function createSuggestion(
  mode: SuggestionMode,
  author: Actor,
  originalText?: string,
  suggestedText?: string
): Suggestion {
  return {
    id: `sugg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mode,
    author,
    createdAt: new Date().toISOString(),
    originalText,
    suggestedText
  };
}

/**
 * Accepts a suggestion:
 * - If mode === 'insert': keep text, strip the suggestion mark.
 * - If mode === 'delete': remove text completely.
 * - Generates an immutable audit event.
 */
export function acceptSuggestion(
  document: AuroraDocument,
  suggestionId: string,
  actor: Actor
): AcceptanceResult {
  const validated = validateDocument(document);

  function transformNodes(nodes: AuroraNode[]): AuroraNode[] {
    const output: AuroraNode[] = [];

    for (const node of nodes) {
      if (node.type === 'text') {
        const suggestionMark = node.marks?.find(
          (m) => m.type === 'suggestion' && m.attrs?.id === suggestionId
        );

        if (suggestionMark) {
          const mode = (suggestionMark.attrs?.mode as string) || 'insert';
          if (mode === 'insert') {
            // Keep text, strip this suggestion mark
            const remainingMarks = (node.marks || []).filter(
              (m) => !(m.type === 'suggestion' && m.attrs?.id === suggestionId)
            );
            output.push({
              ...node,
              marks: remainingMarks.length > 0 ? remainingMarks : undefined
            });
          }
          // If mode === 'delete', drop text
          continue;
        }
      }

      const transformedChildren = node.content ? transformNodes(node.content) : undefined;
      output.push({
        ...node,
        ...(transformedChildren ? { content: transformedChildren } : {})
      });
    }

    return output;
  }

  const updatedDoc: AuroraDocument = {
    ...validated,
    content: transformNodes(validated.content)
  };

  const auditEvent: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action: 'suggestion.accepted',
    suggestionId,
    actorId: actor.id,
    timestamp: new Date().toISOString()
  };

  return {
    document: validateDocument(updatedDoc),
    auditEvent
  };
}

/**
 * Rejects a suggestion:
 * - If mode === 'insert': remove text.
 * - If mode === 'delete': keep text, strip suggestion mark.
 * - Generates an immutable audit event.
 */
export function rejectSuggestion(
  document: AuroraDocument,
  suggestionId: string,
  actor: Actor
): RejectionResult {
  const validated = validateDocument(document);

  function transformNodes(nodes: AuroraNode[]): AuroraNode[] {
    const output: AuroraNode[] = [];

    for (const node of nodes) {
      if (node.type === 'text') {
        const suggestionMark = node.marks?.find(
          (m) => m.type === 'suggestion' && m.attrs?.id === suggestionId
        );

        if (suggestionMark) {
          const mode = (suggestionMark.attrs?.mode as string) || 'insert';
          if (mode === 'delete') {
            // Rejection of delete means keep text, remove mark
            const remainingMarks = (node.marks || []).filter(
              (m) => !(m.type === 'suggestion' && m.attrs?.id === suggestionId)
            );
            output.push({
              ...node,
              marks: remainingMarks.length > 0 ? remainingMarks : undefined
            });
          }
          // If mode === 'insert', drop text
          continue;
        }
      }

      const transformedChildren = node.content ? transformNodes(node.content) : undefined;
      output.push({
        ...node,
        ...(transformedChildren ? { content: transformedChildren } : {})
      });
    }

    return output;
  }

  const updatedDoc: AuroraDocument = {
    ...validated,
    content: transformNodes(validated.content)
  };

  const auditEvent: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action: 'suggestion.rejected',
    suggestionId,
    actorId: actor.id,
    timestamp: new Date().toISOString()
  };

  return {
    document: validateDocument(updatedDoc),
    auditEvent
  };
}
