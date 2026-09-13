import type { AuroraExtension } from './types.js';

export class ExtensionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtensionValidationError';
  }
}

/**
 * Ensures extension IDs are namespaced (e.g. '@vendor/name' or 'org/name').
 */
export function assertNamespacedId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new ExtensionValidationError('Extension id must be a non-empty string');
  }

  // Must contain a slash separating namespace and name
  const parts = id.split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new ExtensionValidationError(
      `Extension id "${id}" must be namespaced (e.g., "@org/feature" or "org/feature")`
    );
  }
}

export class ExtensionRegistry {
  private extensions = new Map<string, AuroraExtension<any>>();

  register(extension: AuroraExtension<any>): void {
    assertNamespacedId(extension.id);

    if (this.extensions.has(extension.id)) {
      throw new ExtensionValidationError(
        `Duplicate extension id: "${extension.id}" is already registered`
      );
    }

    this.extensions.set(extension.id, extension);
  }

  get(id: string): AuroraExtension<any> | undefined {
    return this.extensions.get(id);
  }

  getAll(): AuroraExtension<any>[] {
    return Array.from(this.extensions.values());
  }

  has(id: string): boolean {
    return this.extensions.has(id);
  }

  validateExtensionConfig(id: string, config: unknown): void {
    const ext = this.extensions.get(id);
    if (!ext) {
      throw new ExtensionValidationError(`Extension "${id}" is not registered`);
    }

    if (ext.validateConfig) {
      ext.validateConfig(config);
    }
  }

  clear(): void {
    this.extensions.clear();
  }
}

export const globalExtensionRegistry = new ExtensionRegistry();
