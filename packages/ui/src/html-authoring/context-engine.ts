import type { AuroraEditor } from '@aurora/editor';
import type {
  HtmlElementDefinition,
  RteContext,
  ElementAvailability,
  UserPreferences,
  RtePolicy,
  EditorMode
} from './types.js';

/**
 * Evaluates whether an element can be inserted in the current context,
 * calculates relevance score, and determines the best insertion strategy and suggested action.
 */
export function evaluateElementAvailability(
  def: HtmlElementDefinition,
  context: RteContext,
  userPrefs?: Partial<UserPreferences>,
  policy?: RtePolicy
): ElementAvailability {
  // 1. Policy check
  if (policy) {
    if (policy.restrictedElements.includes(def.tagName.toLowerCase())) {
      return {
        allowed: false,
        score: 0,
        reason: `Element <${def.tagName}> is prohibited by editor policy`,
        insertionStrategy: def.insertionMode
      };
    }
    if (policy.allowedElements.length > 0 && !policy.allowedElements.includes(def.tagName.toLowerCase())) {
      return {
        allowed: false,
        score: 0,
        reason: `Element <${def.tagName}> is not allowed by the active policy`,
        insertionStrategy: def.insertionMode
      };
    }
  }

  // 2. Disallowed parents check
  if (context.parentTag && def.disallowedParents?.map((p) => p.toLowerCase()).includes(context.parentTag.toLowerCase())) {
    return {
      allowed: false,
      score: 0,
      reason: `<${def.tagName}> cannot be placed inside <${context.parentTag}>`,
      insertionStrategy: def.insertionMode
    };
  }

  // 3. Allowed parents check for contextual children
  if (def.allowedParents && def.allowedParents.length > 0) {
    const parentMatches = context.parentTag && def.allowedParents.map((p) => p.toLowerCase()).includes(context.parentTag.toLowerCase());
    if (!parentMatches) {
      return {
        allowed: false,
        score: 0,
        reason: `<${def.tagName}> must be placed inside one of: ${def.allowedParents.join(', ')}`,
        insertionStrategy: def.insertionMode
      };
    }
  }

  // 4. Mode Compatibility
  let modeCompatibility = 1.0;
  if (context.editorMode === 'standard') {
    if (!def.menu.visibleInStandard) modeCompatibility = 0.2;
  } else if (context.editorMode === 'email') {
    // Email prefers simple inline/table/paragraph structures
    if (['script', 'iframe', 'video', 'audio', 'canvas', 'form', 'dialog'].includes(def.tagName)) {
      return {
        allowed: false,
        score: 0,
        reason: `<${def.tagName}> is not supported in Email mode`,
        insertionStrategy: def.insertionMode
      };
    }
    modeCompatibility = 0.8;
  }

  // 5. Context Match
  let contextMatch = 0.5;
  let suggestedAction: 'insert' | 'transform' | 'configure' | 'inspect' = 'insert';

  if (def.insertionMode === 'configuration') {
    suggestedAction = 'configure';
  }

  if (context.selectionType === 'text') {
    if (def.isInline) {
      contextMatch = 1.0;
    } else if (def.insertionMode === 'block') {
      contextMatch = 0.8;
    } else {
      contextMatch = 0.4;
    }
  } else if (context.selectionType === 'table-cell') {
    if (['table', 'tr', 'td', 'th'].includes(def.tagName)) {
      contextMatch = 0.9;
    } else if (def.isInline || def.tagName === 'p') {
      contextMatch = 0.8;
    } else {
      contextMatch = 0.3;
    }
  } else if (context.selectionType === 'list-item') {
    if (def.tagName === 'li' || def.isInline) {
      contextMatch = 0.9;
    } else {
      contextMatch = 0.4;
    }
  } else if (context.selectionType === 'container' || context.selectionType === 'document-root') {
    if (def.isContainer || def.insertionMode === 'block' || def.isComposite) {
      contextMatch = 1.0;
    } else if (def.isInline) {
      contextMatch = 0.3;
    }
  }

  // 6. Favorites and Recent Usage
  const isFavorite = userPrefs?.favorites?.includes(def.tagName.toLowerCase()) ? 1 : 0;
  const recentIndex = userPrefs?.recentElements?.indexOf(def.tagName.toLowerCase()) ?? -1;
  const recentUsage = recentIndex >= 0 ? Math.max(0, 1 - recentIndex * 0.1) : 0;
  const frequency = 1.0 / Math.max(1, def.menu.priority);

  // Score formula matching doc 05:
  // score = contextMatch * 50 + frequency * 20 + recentUsage * 15 + favoriteBoost * 10 + modeCompatibility * 5
  const score = Math.round(
    contextMatch * 50 +
    frequency * 20 +
    recentUsage * 15 +
    isFavorite * 10 +
    modeCompatibility * 5
  );

  return {
    allowed: true,
    score,
    insertionStrategy: def.insertionMode,
    suggestedAction
  };
}

/**
 * Extracts the current RteContext from an AuroraEditor instance
 */
export function extractRteContext(editor: AuroraEditor, mode: EditorMode = 'standard', policyId?: string): RteContext {
  const elem = editor.getElement();
  const sel = window.getSelection();

  const ancestorTags: string[] = [];
  let parentTag: string | undefined;
  let selectionType: RteContext['selectionType'] = 'block';
  const selectedNodeTags: string[] = [];

  if (sel && sel.rangeCount > 0 && elem) {
    let node: Node | null = sel.anchorNode;
    if (node && !elem.contains(node)) {
      node = elem;
    }

    // Traverse ancestors up to editor root
    let curr = node;
    while (curr && curr !== elem && curr !== document.body) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const tag = (curr as HTMLElement).tagName.toLowerCase();
        ancestorTags.push(tag);
        if (!parentTag) parentTag = tag;
      }
      curr = curr.parentNode;
    }

    // Determine selection type
    if (ancestorTags.includes('td') || ancestorTags.includes('th')) {
      selectionType = 'table-cell';
    } else if (ancestorTags.includes('li')) {
      selectionType = 'list-item';
    } else if (!sel.isCollapsed) {
      selectionType = 'text';
    } else if (ancestorTags.includes('section') || ancestorTags.includes('article') || ancestorTags.includes('div')) {
      selectionType = 'container';
    } else if (ancestorTags.length === 0) {
      selectionType = 'document-root';
    } else {
      selectionType = 'block';
    }
  }

  return {
    parentTag,
    ancestorTags,
    selectionType,
    selectedNodeTags,
    editorMode: mode,
    policyId
  };
}
