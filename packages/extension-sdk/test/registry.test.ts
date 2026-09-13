import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionRegistry } from '../src/registry.js';
import type { AuroraExtension } from '../src/types.js';

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry();
  });

  const validExt: AuroraExtension = {
    id: '@vendor/custom-callout',
    version: '1.0.0',
    title: 'Custom Callout',
    schemaAdditions: {
      type: 'custom_block',
      validateData: (data: unknown) => typeof (data as any)?.type === 'string'
    }
  };

  it('registers valid namespaced extension and throws on duplicate id', () => {
    expect(() => registry.register(validExt)).not.toThrow();
    expect(() => registry.register(validExt)).toThrow(/duplicate extension id/i);
  });

  it('rejects un-namespaced extension IDs', () => {
    const invalidExt: AuroraExtension = {
      id: 'simple-id',
      version: '1.0.0',
      title: 'Invalid'
    };
    expect(() => registry.register(invalidExt)).toThrow(/namespaced/i);
  });

  it('validates extension config against declared validator', () => {
    const configExt: AuroraExtension<{ maxItems: number }> = {
      id: '@corp/item-limiter',
      version: '1.0.0',
      title: 'Limiter',
      validateConfig: (config) => {
        if (!config || typeof config.maxItems !== 'number' || config.maxItems <= 0) {
          throw new Error('maxItems must be positive number');
        }
      }
    };

    registry.register(configExt);

    expect(() => registry.validateExtensionConfig('@corp/item-limiter', { maxItems: 10 })).not.toThrow();
    expect(() => registry.validateExtensionConfig('@corp/item-limiter', { maxItems: -1 })).toThrow(/positive number/);
  });

  it('retrieves registered extensions by id or lists all', () => {
    registry.register(validExt);
    expect(registry.get('@vendor/custom-callout')).toBe(validExt);
    expect(registry.getAll().length).toBe(1);
  });
});
