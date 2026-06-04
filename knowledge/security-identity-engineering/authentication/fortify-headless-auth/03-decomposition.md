# Decomposition: fortify headless auth

## Topic Overview

Laravel Fortify is a frontend-agnostic authentication backend that provides routes, controllers, and actions for login, registration, password reset, email verification, and two-factor authentication — without imposing any UI. It decouples auth logic from presentation, allowing SPAs, mobile apps, or traditional server-rendered apps to share a single auth backend. As of early 2026, Fortify v1.37+ ships built-in passkey (WebAuthn) support. It is the backend engine powering all Laravel Starter...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
fortify-headless-auth/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### fortify headless auth
- **Purpose:** Laravel Fortify is a frontend-agnostic authentication backend that provides routes, controllers, and actions for login, registration, password reset, email verification, and two-factor authentication — without imposing any UI. It decouples auth logic from presentation, allowing SPAs, mobile apps, or traditional server-rendered apps to share a single auth backend. As of early 2026, Fortify v1.37+ ships built-in passkey (WebAuthn) support. It is the backend engine powering all Laravel Starter...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Auth guards/providers architecture, Service providers, Middleware pipeline, Related: Sanctum SPA cookie auth, MFA/TOTP with Fortify, First-party Passkeys/WebAuthn, Advanced Follow-up: Fortify action pipeline deep customization, Response contract binding patterns, and Stateless Fortify for mobile backends

## Dependency Graph
**Depends on:** Prerequisites: Auth guards/providers architecture, Service providers, Middleware pipeline, Related: Sanctum SPA cookie auth, MFA/TOTP with Fortify, First-party Passkeys/WebAuthn, Advanced Follow-up: Fortify action pipeline deep customization, Response contract binding patterns, and Stateless Fortify for mobile backends
**Depended on by:** Knowledge units that leverage or extend fortify headless auth patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for fortify headless auth.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization