# Working Guide

## Mission

Deliver an attractive, complete rich-text editor that embeds through TypeScript, a Web Component, Angular, or React without requiring a backend or product branding. Core editing must be responsive, accessible, safe, and useful by itself. Enterprise modules may add organization-scale services without changing the core document format or public API.

## v1 user journey

1. The host installs the editor and selected integration bridge.
2. It supplies a versioned Aurora JSON document and configuration.
3. Users edit through a white-label accessible UI.
4. The editor emits typed changes; the host validates and persists them.
5. The host optionally supplies adapters for uploads, mentions, embeds, AI, or enterprise services.

## Expected repository layout

- packages/model: JSON schema, validation, migrations
- packages/editor: stable public facade and commands
- packages/engine-prosemirror: private editing engine adapter
- packages/features: tree-shakable core features
- packages/ui: accessible UI primitives and themes
- packages/web-component, packages/angular, packages/react: integration bridges
- packages/extension-sdk: public customisation contracts
- packages/enterprise-*: separately licensed packages
- apps/playground and apps/docs: manual QA and developer docs
- tests/e2e and tests/fixtures: browser coverage and safety fixtures

## Delivery order

Model and migrations; engine adapter; commands/events; features; UI; bridges; import/export; security/accessibility; packaging/docs; enterprise services. Do not start collaboration, offline sync, DOCX conversion, or full tracked changes before model transformations and revision invariants are proven.

## Done means

A change has focused tests, integration/E2E tests where relevant, accessibility coverage, documentation/API updates, a migration review, performance/bundle check, and security/public-boundary review.

