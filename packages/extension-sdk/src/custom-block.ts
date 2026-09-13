import type { AuroraNode } from '@aurora/model';

export interface CustomBlockDefinition<TData = Record<string, unknown>> {
  extensionId: string;
  validateData: (data: unknown) => data is TData;
  fallbackText: (data: TData) => string;
  renderEditable: (data: TData, onUpdate: (newData: Partial<TData>) => void) => HTMLElement | string;
  renderReadOnly: (data: TData) => HTMLElement | string;
  toHtml?: (data: TData) => string;
  toMarkdown?: (data: TData) => string;
  migrate?: (data: unknown, version: number) => TData;
}

export function defineCustomBlock<TData = Record<string, unknown>>(
  definition: CustomBlockDefinition<TData>
): CustomBlockDefinition<TData> {
  if (!definition.extensionId || !definition.extensionId.includes('/')) {
    throw new Error(`Custom block extensionId "${definition.extensionId}" must be namespaced`);
  }
  return definition;
}

export function createCustomBlockNode(
  extensionId: string,
  data: Record<string, unknown>
): AuroraNode {
  return {
    type: 'custom_block',
    attrs: {
      extensionId,
      data
    }
  };
}
