# Decomposition: spatie passkeys

## Topic Overview

`spatie/laravel-passkeys` is the mature, production-hardened alternative to first-party `laravel/passkeys`, specifically built for Livewire applications. It ships ready-to-use Livewire components for passkey registration, authentication, and management — alongside custom Artisan commands and a full WebAuthn implementation based on `web-auth/webauthn-lib`. Battle-tested in production at Mailcoach and other Spatie products. It trades stack-agnosticism (first-party) for deep Livewire integrati...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
spatie-passkeys/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### spatie passkeys
- **Purpose:** `spatie/laravel-passkeys` is the mature, production-hardened alternative to first-party `laravel/passkeys`, specifically built for Livewire applications. It ships ready-to-use Livewire components for passkey registration, authentication, and management — alongside custom Artisan commands and a full WebAuthn implementation based on `web-auth/webauthn-lib`. Battle-tested in production at Mailcoach and other Spatie products. It trades stack-agnosticism (first-party) for deep Livewire integrati...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: WebAuthn ceremonies (attestation, assertion), Livewire component architecture, Related: First-party Passkeys/WebAuthn (`laravel/passkeys`), WebAuthn ceremonies, and Advanced Follow-up: Custom WebAuthn ceremony flows with `web-auth/webauthn-lib`

## Dependency Graph
**Depends on:** Prerequisites: WebAuthn ceremonies (attestation, assertion), Livewire component architecture, Related: First-party Passkeys/WebAuthn (`laravel/passkeys`), WebAuthn ceremonies, and Advanced Follow-up: Custom WebAuthn ceremony flows with `web-auth/webauthn-lib`
**Depended on by:** Knowledge units that leverage or extend spatie passkeys patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for spatie passkeys.
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