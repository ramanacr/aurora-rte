import { describe, it, expect } from 'vitest';
import { checkImports, checkAllBoundaries } from './check-package-boundaries.mjs';

describe('Package Boundaries Checker', () => {
  it('throws when a file imports a forbidden package prefix', () => {
    const dummyCode = `import { something } from '@aurora/enterprise-review';`;
    expect(() =>
      checkImports('dummy.ts', dummyCode, ['@aurora/enterprise-review'])
    ).toThrow(/forbidden import/i);
  });

  it('passes when imports are allowed', () => {
    const dummyCode = `import { validateDocument } from '@aurora/model';`;
    expect(() =>
      checkImports('dummy.ts', dummyCode, ['@aurora/enterprise-review'])
    ).not.toThrow();
  });

  it('enforces monorepo architectural rules without violations', () => {
    const result = checkAllBoundaries();
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
