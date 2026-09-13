# Security and Privacy Model

## Threats

Stored/reflected XSS through pasted HTML; malicious URLs/embeds; unsafe uploads; compromised extensions; data exfiltration through diagnostics or AI; cross-tenant leakage in enterprise services; and denial of service through pathological documents.

## Mandatory controls

- Allow-list parse HTML; strip scripts, event handlers, unsafe CSS, active SVG, forms, iframes, unsafe URL schemes, and unknown elements.
- Normalize URLs before rendering and validate again before activation/export.
- Allow-list embed providers and sandbox previews; let hosts veto embeds.
- Delegate files to host upload APIs; never ship credentials or bypass malware/authorization controls.
- Disable telemetry by default; diagnostics contain no document body or PII.
- Enforce JSON depth, node count, text length, table size, and import-time limits.
- Lock dependencies; generate SBOMs; scan vulnerabilities; sign releases; publish security advisories.
- Require tenant-scoped authorization, encryption, immutable audit events, and restore tests in enterprise services.

## Security fixtures

Maintain fixtures for DOM clobbering, malformed tables, hostile SVG, obfuscated schemes, copied Word markup, huge documents, extension mismatch, and asset/comment authorization failures.

