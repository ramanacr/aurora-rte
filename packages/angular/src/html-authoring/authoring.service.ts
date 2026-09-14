import { Injectable, InjectionToken, Optional, Inject } from '@angular/core';
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

export const HTML_ELEMENT_REGISTRY = new InjectionToken<HtmlElementRegistry>('HTML_ELEMENT_REGISTRY');
export const RTE_POLICY = new InjectionToken<RtePolicy>('RTE_POLICY');

@Injectable({
  providedIn: 'root'
})
export class HtmlAuthoringService {
  private registry: HtmlElementRegistry;
  private policy: RtePolicy;
  private activeEditor: AuroraEditor | null = null;
  private currentMode: EditorMode = 'standard';

  // Inspector and Palette state
  public isCommandPaletteOpen = false;
  public isElementPickerOpen = false;
  public isInspectorOpen = false;
  public selectedElementForInspector: HTMLElement | null = null;
  public inspectorData: ElementInspectorData | null = null;

  constructor(
    @Optional() @Inject(HTML_ELEMENT_REGISTRY) customRegistry?: HtmlElementRegistry,
    @Optional() @Inject(RTE_POLICY) customPolicy?: RtePolicy
  ) {
    this.registry = customRegistry || getGlobalRegistry();
    this.policy = customPolicy || STANDARD_POLICIES.standard;
  }

  setEditor(editor: AuroraEditor, mode: EditorMode = 'standard'): void {
    this.activeEditor = editor;
    this.currentMode = mode;
  }

  getEditor(): AuroraEditor | null {
    return this.activeEditor;
  }

  getRegistry(): HtmlElementRegistry {
    return this.registry;
  }

  getPolicy(): RtePolicy {
    return this.policy;
  }

  setPolicy(policy: RtePolicy): void {
    this.policy = policy;
  }

  getCurrentContext(): RteContext {
    if (!this.activeEditor) {
      return {
        ancestorTags: [],
        selectionType: 'block',
        selectedNodeTags: [],
        editorMode: this.currentMode
      };
    }
    return extractRteContext(this.activeEditor, this.currentMode);
  }

  getAvailableElements(): HtmlElementDefinition[] {
    const context = this.getCurrentContext();
    return this.registry.getAvailable(context);
  }

  evaluateElement(def: HtmlElementDefinition): ElementAvailability {
    const context = this.getCurrentContext();
    const prefs = getUserPreferencesManager();
    return evaluateElementAvailability(def, context, prefs.getPreferences(), this.policy);
  }

  insert(def: HtmlElementDefinition, customAttrs?: Record<string, string>): boolean {
    if (!this.activeEditor) return false;
    const context = this.getCurrentContext();
    const res = insertHtmlElement(this.activeEditor, def, context, customAttrs);
    return res.success;
  }

  inspect(element: HTMLElement): ElementInspectorData {
    this.selectedElementForInspector = element;
    this.inspectorData = inspectElement(element, this.registry);
    this.isInspectorOpen = true;
    return this.inspectorData;
  }

  closeInspector(): void {
    this.isInspectorOpen = false;
    this.selectedElementForInspector = null;
    this.inspectorData = null;
  }

  applyFix(issue: AccessibilityIssue): boolean {
    if (!this.selectedElementForInspector) return false;
    const success = applyAccessibilityFix(this.selectedElementForInspector, issue);
    if (success) {
      this.inspectorData = inspectElement(this.selectedElementForInspector, this.registry);
    }
    return success;
  }

  toggleFavorite(tagName: string): boolean {
    return getUserPreferencesManager().toggleFavorite(tagName);
  }

  getFavorites(): string[] {
    return getUserPreferencesManager().getFavorites();
  }

  getRecentElements(): string[] {
    return getUserPreferencesManager().getRecentElements();
  }
}
