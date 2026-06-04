# Decomposition: webauthn ceremonies

## Topic Overview

WebAuthn ceremonies are the cryptographic protocol steps that enable passwordless authentication. Attestation (registration) creates a new credential — the server sends a challenge, the authenticator generates a key pair and returns the public key. Assertion (authentication) proves ownership — the server sends a challenge, the authenticator signs it with the private key, the server verifies. The critical invariants: the private key never leaves the authenticator, the origin is bound to th...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
webauthn-ceremonies/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### webauthn ceremonies
- **Purpose:** WebAuthn ceremonies are the cryptographic protocol steps that enable passwordless authentication. Attestation (registration) creates a new credential — the server sends a challenge, the authenticator generates a key pair and returns the public key. Assertion (authentication) proves ownership — the server sends a challenge, the authenticator signs it with the private key, the server verifies. The critical invariants: the private key never leaves the authenticator, the origin is bound to th...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Public-key cryptography fundamentals (key pairs, signatures), understanding of challenge-response protocols, Related: First-party Passkeys/WebAuthn (`laravel/passkeys`), Spatie Passkeys Livewire components, Advanced Follow-up: WebAuthn extension handling (large blob, credential protection), FIDO2 CTAP2 (external authenticator protocol), and JSON serialization for WebAuthn responses

## Dependency Graph
**Depends on:** Prerequisites: Public-key cryptography fundamentals (key pairs, signatures), understanding of challenge-response protocols, Related: First-party Passkeys/WebAuthn (`laravel/passkeys`), Spatie Passkeys Livewire components, Advanced Follow-up: WebAuthn extension handling (large blob, credential protection), FIDO2 CTAP2 (external authenticator protocol), and JSON serialization for WebAuthn responses
**Depended on by:** Knowledge units that leverage or extend webauthn ceremonies patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for webauthn ceremonies.
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