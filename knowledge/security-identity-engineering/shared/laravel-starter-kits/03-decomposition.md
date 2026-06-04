# Decomposition: laravel starter kits

## Topic Overview

Laravel 12/13 Starter Kits are the current recommended authentication scaffolding, replacing the deprecated Breeze and Jetstream. Each kit targets a specific frontend stack: React, Vue, Svelte, or Livewire. All kits ship the canonical Laravel auth stack: Fortify (backend authentication) + Sanctum (SPA cookie auth) + Passkeys (WebAuthn). The kits provide pre-built login, registration, password reset, email verification, passkey registration, and profile management, with the frontend stack chos...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-starter-kits/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel starter kits
- **Purpose:** Laravel 12/13 Starter Kits are the current recommended authentication scaffolding, replacing the deprecated Breeze and Jetstream. Each kit targets a specific frontend stack: React, Vue, Svelte, or Livewire. All kits ship the canonical Laravel auth stack: Fortify (backend authentication) + Sanctum (SPA cookie auth) + Passkeys (WebAuthn). The kits provide pre-built login, registration, password reset, email verification, passkey registration, and profile management, with the frontend stack chos...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Fortify headless auth backend, Sanctum SPA vs Token auth, First-party Passkeys/WebAuthn, Related: Laravel Breeze (legacy), Laravel Jetstream (legacy), Advanced Follow-up: Customizing Starter Kit views, and Starter Kit upgrade strategies between major Laravel versions

## Dependency Graph
**Depends on:** Prerequisites: Fortify headless auth backend, Sanctum SPA vs Token auth, First-party Passkeys/WebAuthn, Related: Laravel Breeze (legacy), Laravel Jetstream (legacy), Advanced Follow-up: Customizing Starter Kit views, and Starter Kit upgrade strategies between major Laravel versions
**Depended on by:** Knowledge units that leverage or extend laravel starter kits patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel starter kits.
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