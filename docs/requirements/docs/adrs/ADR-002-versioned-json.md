# ADR-002: Persist versioned Aurora JSON

**Status:** Accepted

Persist AuroraDocument JSON as canonical. HTML and Markdown are interchange formats only. The versioned model supports migrations, custom blocks, review metadata, collaboration, deterministic tests, and safe serialization. Every schema change requires a migration fixture and compatibility note.

