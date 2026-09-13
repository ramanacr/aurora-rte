import { describe, it, expect } from 'vitest';
import * as EditorModule from '../src/index.js';

describe('Editor Engine Isolation', () => {
  it('does not export ProseMirror types, objects or functions from @aurora/editor', () => {
    const exports = Object.keys(EditorModule);
    for (const exp of exports) {
      expect(exp.toLowerCase()).not.toContain('prosemirror');
      expect(exp.toLowerCase()).not.toContain('editortransform');
      expect(exp.toLowerCase()).not.toContain('transaction');
    }
  });
});
