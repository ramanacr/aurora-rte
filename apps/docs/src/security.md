# Security & Sanitization Guide

Aurora Editor treats HTML, JSON payloads, URLs, embeds, and extension inputs as untrusted until validated.

## Core Security Controls

1. **Strict Allow-List HTML Parser:** Strips `<script>`, `<style>`, `<svg>`, `<form>`, `<input>`, `<iframe>`, and unknown elements.
2. **Event Handler Neutralization:** Removes `onerror`, `onload`, `onclick`, and all `on*` inline handler attributes.
3. **URL Scheme Allowlisting:** Only `http:`, `https:`, `mailto:`, and `tel:` are permitted. `javascript:`, `vbscript:`, and `data:text/html` are stripped.
4. **Sandboxed Embeds:** Only allowlisted providers (e.g. YouTube, Vimeo, CodePen) can be rendered in iframes.
5. **No Implicit Network Access:** Core editor never makes outbound network calls. All file uploads and mentions route through host-supplied adapters.
6. **Immutable Audit Trails:** Enterprise review actions produce tenant-scoped audit logs with redacted content bodies.
