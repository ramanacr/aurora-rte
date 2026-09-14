import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AuroraEditor } from '@aurora/editor';
import {
  type HtmlElementDefinition,
  type HtmlElementRegistry,
  type RteContext,
  type ElementAvailability,
  type RtePolicy,
  type ElementInspectorData,
  type AccessibilityIssue,
  type EditorMode,
  getGlobalRegistry,
  evaluateElementAvailability,
  extractRteContext,
  insertHtmlElement,
  inspectElement,
  applyAccessibilityFix,
  getUserPreferencesManager,
  STANDARD_POLICIES
} from '@aurora/ui';

export interface AuroraContextValue {
  editor: AuroraEditor | null;
  registry: HtmlElementRegistry;
  policy: RtePolicy;
  mode: EditorMode;
  context: RteContext;

  // Dialog / Drawer states
  isElementPickerOpen: boolean;
  setElementPickerOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isInspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;
  selectedElementForInspector: HTMLElement | null;
  inspectorData: ElementInspectorData | null;

  // Actions
  insert: (def: HtmlElementDefinition, customAttrs?: Record<string, string>) => boolean;
  evaluateElement: (def: HtmlElementDefinition) => ElementAvailability;
  inspect: (element: HTMLElement) => ElementInspectorData;
  closeInspector: () => void;
  applyFix: (issue: AccessibilityIssue) => boolean;
  toggleFavorite: (tagName: string) => boolean;
  getFavorites: () => string[];
  getRecentElements: () => string[];
}

const AuroraContext = createContext<AuroraContextValue | null>(null);

export interface AuroraProviderProps {
  editor: AuroraEditor | null;
  registry?: HtmlElementRegistry;
  policy?: RtePolicy;
  mode?: EditorMode;
  children: React.ReactNode;
}

export function AuroraProvider({
  editor,
  registry = getGlobalRegistry(),
  policy = STANDARD_POLICIES.standard,
  mode = 'standard',
  children
}: AuroraProviderProps) {
  const [isElementPickerOpen, setElementPickerOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isInspectorOpen, setInspectorOpen] = useState(false);
  const [selectedElementForInspector, setSelectedElementForInspector] = useState<HTMLElement | null>(null);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const [inspectorData, setInspectorData] = useState<ElementInspectorData | null>(null);
  const [context, setContext] = useState<RteContext>(() => {
    if (!editor) {
      return {
        ancestorTags: [],
        selectionType: 'block',
        selectedNodeTags: [],
        editorMode: mode
      };
    }
    return extractRteContext(editor, mode);
  });

  // Listen to selection changes to keep context reactive
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.on('selectionChange', () => {
      setContext(extractRteContext(editor, mode));
    });

    return () => {
      unsub();
    };
  }, [editor, mode]);

  const insert = useCallback((def: HtmlElementDefinition, customAttrs?: Record<string, string>) => {
    if (!editor) return false;
    const currentContext = extractRteContext(editor, mode);
    const res = insertHtmlElement(editor, def, currentContext, customAttrs);
    return res.success;
  }, [editor, mode]);

  const evaluateElement = useCallback((def: HtmlElementDefinition) => {
    const prefs = getUserPreferencesManager();
    return evaluateElementAvailability(def, context, prefs.getPreferences(), policy);
  }, [context, policy]);

  const inspect = useCallback((element: HTMLElement) => {
    selectedElementRef.current = element;
    setSelectedElementForInspector(element);
    const data = inspectElement(element, registry);
    setInspectorData(data);
    setInspectorOpen(true);
    return data;
  }, [registry]);

  const closeInspector = useCallback(() => {
    selectedElementRef.current = null;
    setInspectorOpen(false);
    setSelectedElementForInspector(null);
    setInspectorData(null);
  }, []);

  const applyFix = useCallback((issue: AccessibilityIssue) => {
    const elem = selectedElementRef.current || selectedElementForInspector;
    if (!elem) return false;
    const success = applyAccessibilityFix(elem, issue);
    if (success) {
      setInspectorData(inspectElement(elem, registry));
    }
    return success;
  }, [selectedElementForInspector, registry]);

  const toggleFavorite = useCallback((tagName: string) => {
    return getUserPreferencesManager().toggleFavorite(tagName);
  }, []);

  const getFavorites = useCallback(() => {
    return getUserPreferencesManager().getFavorites();
  }, []);

  const getRecentElements = useCallback(() => {
    return getUserPreferencesManager().getRecentElements();
  }, []);

  const value = useMemo<AuroraContextValue>(() => ({
    editor,
    registry,
    policy,
    mode,
    context,
    isElementPickerOpen,
    setElementPickerOpen,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isInspectorOpen,
    setInspectorOpen,
    selectedElementForInspector,
    inspectorData,
    insert,
    evaluateElement,
    inspect,
    closeInspector,
    applyFix,
    toggleFavorite,
    getFavorites,
    getRecentElements
  }), [
    editor,
    registry,
    policy,
    mode,
    context,
    isElementPickerOpen,
    isCommandPaletteOpen,
    isInspectorOpen,
    selectedElementForInspector,
    inspectorData,
    insert,
    evaluateElement,
    inspect,
    closeInspector,
    applyFix,
    toggleFavorite,
    getFavorites,
    getRecentElements
  ]);

  return (
    <AuroraContext.Provider value={value}>
      {children}
    </AuroraContext.Provider>
  );
}

export function useAurora(): AuroraContextValue {
  const ctx = useContext(AuroraContext);
  if (!ctx) {
    throw new Error('useAurora must be used within an <AuroraProvider>');
  }
  return ctx;
}

export function useHtmlRegistry(): HtmlElementRegistry {
  return useAurora().registry;
}

export function useRteContext(): RteContext {
  return useAurora().context;
}

export function useCommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useAurora();
  return { isOpen: isCommandPaletteOpen, setOpen: setCommandPaletteOpen };
}

export function useElementInspector() {
  const { isInspectorOpen, setInspectorOpen, inspectorData, inspect, closeInspector, applyFix } = useAurora();
  return { isOpen: isInspectorOpen, setOpen: setInspectorOpen, data: inspectorData, inspect, closeInspector, applyFix };
}
