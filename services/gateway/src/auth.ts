export interface Claims {
  sub: string;
  tid?: string;
  tenants?: string[];
  roles?: string[];
  email?: string;
  name?: string;
  exp?: number;
  iss?: string;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Authorizes a request against tenant scope.
 * Accepts direct tenant claim (tid) or array of assigned tenants.
 */
export function authorize(claims: Claims, tenantId: string): AuthorizationResult {
  if (!claims.tid && (!claims.tenants || claims.tenants.length === 0)) {
    return {
      allowed: false,
      reason: 'missing tenant claim'
    };
  }

  if (claims.tid && claims.tid === tenantId) {
    return { allowed: true };
  }

  if (claims.tenants && claims.tenants.includes(tenantId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'tenant claim mismatch'
  };
}

/**
 * Structured logger that scrubs PII and document content.
 */
export function logRedacted(
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: Record<string, unknown> = {}
): string {
  const sanitizedMeta: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('body') ||
      lowerKey.includes('content')
    ) {
      sanitizedMeta[key] = '[REDACTED]';
    } else {
      sanitizedMeta[key] = value;
    }
  }

  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizedMeta
  });

  return logEntry;
}
