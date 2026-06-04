# Rules: Laravel Starter Kits

## Metadata
- **Source KU:** laravel-starter-kits
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- KIT-RULE-001: **Choose kit based on needs** — Breeze for simple auth; Jetstream for teams/2FA/API tokens; none for API-only.
- KIT-RULE-002: **Match stack to team skills** — Blade for backend-heavy; Livewire for interactive UIs; React/Vue for SPA experts.
- KIT-RULE-003: **Extend, don't modify** — Keep generated code in designated directories; extend rather than modify for future updates.
- KIT-RULE-004: **Understand generated code** — Don't use features without knowing how team scoping, permissions, middleware work.
- KIT-RULE-005: **Plan for customization** — Starter kits are starting points; most production apps need custom auth flows.

## Architecture Rules
- KIT-RULE-006: **Start with Breeze for prototyping** — Upgrade to Jetstream if teams become necessary (documented migration path).
- KIT-RULE-007: **Keep starter kit code separate** — Application code should be separate from scaffolding.
- KIT-RULE-008: **Configure through config** — `Jetstream::teams()`, `Fortify::authenticateUsing()` rather than modifying generated files.
- KIT-RULE-009: **Use Fortify directly** for heavy custom auth without Jetstream's UI layers.

## Decision Rules
- KIT-RULE-010: **Use Breeze for most new Laravel web apps** needing auth but not teams/2FA.
- KIT-RULE-011: **Use Jetstream for SaaS/multi-tenant apps** requiring teams, 2FA, API tokens.
- KIT-RULE-012: **Use no starter kit** for API-only backends, microservices, or custom auth implementations.
- KIT-RULE-013: **Don't install on existing apps** — Starter kits overwrite auth files.
