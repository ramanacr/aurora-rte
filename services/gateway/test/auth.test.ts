import { describe, it, expect } from 'vitest';
import { authorize, type Claims } from '../src/auth.js';

describe('Gateway Tenant Authorization Policy', () => {
  it('denies authorization when tenant claim is missing', () => {
    const claims: Claims = { sub: 'u1' };
    expect(authorize(claims, 'tenant-a')).toEqual({
      allowed: false,
      reason: 'missing tenant claim'
    });
  });

  it('denies authorization when tenant claim does not match requested tenant', () => {
    const claims: Claims = { sub: 'u1', tid: 'tenant-b' };
    expect(authorize(claims, 'tenant-a')).toEqual({
      allowed: false,
      reason: 'tenant claim mismatch'
    });
  });

  it('allows access when token includes matching tenant claim or multi-tenant roles', () => {
    const claims: Claims = { sub: 'u1', tid: 'tenant-a', roles: ['editor'] };
    expect(authorize(claims, 'tenant-a')).toEqual({
      allowed: true
    });

    // Multi-tenant admin claim
    const adminClaims: Claims = { sub: 'admin', tenants: ['tenant-a', 'tenant-b'] };
    expect(authorize(adminClaims, 'tenant-a')).toEqual({
      allowed: true
    });
  });
});
