import type { AuroraEditor } from '@aurora/editor';
import type { AuroraDocument, AuroraNode } from '@aurora/model';

export interface ExtensionSchemaAdditions {
  type: string;
  validateData?: (data: unknown) => boolean;
  migrate?: (oldData: unknown, oldVersion: number) => unknown;
}

export interface ExtensionKeyBinding {
  key: string;
  command: string;
  args?: Record<string, unknown>;
}

export interface CustomBlockRendererContext {
  extensionId: string;
  data: Record<string, unknown>;
  isEditable: boolean;
  updateData: (newData: Record<string, unknown>) => void;
}

export interface AuroraExtension<TConfig = unknown> {
  id: string; // Must be namespaced, e.g. '@vendor/callout' or 'vendor/callout'
  version: string;
  title: string;
  description?: string;
  author?: string;
  license?: string;
  schemaAdditions?: ExtensionSchemaAdditions;
  commands?: Record<string, (editor: AuroraEditor, args?: unknown) => void>;
  keyBindings?: ExtensionKeyBinding[];
  validateConfig?: (config: TConfig) => void;
  renderBlock?: (context: CustomBlockRendererContext) => HTMLElement | string;
  fallbackText?: (node: AuroraNode) => string;
}
