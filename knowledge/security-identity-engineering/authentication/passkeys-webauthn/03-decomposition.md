# Decomposition: passkeys webauthn

## Topic Overview

First-party `laravel/passkeys` (v0.2.x, April 2026) brings WebAuthn passwordless authentication directly into the Laravel ecosystem, integrated with Fortify and Sanctum. It provides server-side support for the WebAuthn protocol — credential registration (attestation) and authentication (assertion) — using platform authenticators (Face ID, Touch ID, Windows Hello, hardware security keys). The paired `@laravel/passkeys` npm package provides the browser-side WebAuthn API calls. This is an em...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
passkeys-webauthn/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### passkeys webauthn
- **Purpose:** First-party `laravel/passkeys` (v0.2.x, April 2026) brings WebAuthn passwordless authentication directly into the Laravel ecosystem, integrated with Fortify and Sanctum. It provides server-side support for the WebAuthn protocol — credential registration (attestation) and authentication (assertion) — using platform authenticators (Face ID, Touch ID, Windows Hello, hardware security keys). The paired `@laravel/passkeys` npm package provides the browser-side WebAuthn API calls. This is an em...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: WebAuthn ceremonies (attestation and assertion), Fortify headless auth backend, Sanctum SPA cookie auth, Related: Spatie Passkeys Livewire components, WebAuthn ceremonies, MFA/TOTP with Fortify, Advanced Follow-up: Cross-device passkey credential synchronization, WebAuthn user verification policies, and Passkey-first authentication strategy

## Dependency Graph
**Depends on:** Prerequisites: WebAuthn ceremonies (attestation and assertion), Fortify headless auth backend, Sanctum SPA cookie auth, Related: Spatie Passkeys Livewire components, WebAuthn ceremonies, MFA/TOTP with Fortify, Advanced Follow-up: Cross-device passkey credential synchronization, WebAuthn user verification policies, and Passkey-first authentication strategy
**Depended on by:** Knowledge units that leverage or extend passkeys webauthn patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for passkeys webauthn.
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