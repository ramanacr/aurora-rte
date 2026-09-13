# Extension SDK

## Contract

An extension declares a namespaced id, semantic version, schema additions, commands, key bindings, serializers, renderers, and configuration validation. It may not directly mutate another extension's state, inject untrusted HTML, inspect host credentials, or make network calls except through a documented host adapter.

## Custom blocks

Every block declares JSON validation, accessible fallback text, editable/read-only rendering, import/paste behavior, serialization, and migrations. Host applications can allow-list extension ids. Business blocks store stable references rather than duplicate sensitive data.

## Compatibility

Core extensions are Apache-2.0. Third-party extensions declare their license in metadata. Commercial extensions use only public core contracts. Contract fixtures run against every supported core release before publication.

