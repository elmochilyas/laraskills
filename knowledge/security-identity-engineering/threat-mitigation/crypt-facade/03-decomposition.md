# Decomposition: crypt facade

## Topic Overview

Laravel's `Crypt` facade provides AES-256 encryption/decryption using the application's `APP_KEY`. The default cipher is `AES-256-CBC` (Laravel ≤10) or `AES-256-GCM` (Laravel 11+). GCM provides authenticated encryption (AEAD) — it verifies both confidentiality and integrity, preventing ciphertext tampering. CBC requires a separate HMAC for integrity (encrypt-then-MAC). The encryption key (`APP_KEY`) is derived from the base64-encoded key in `.env`. Rotating `APP_KEY` invalidates all encry...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
crypt-facade/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### crypt facade
- **Purpose:** Laravel's `Crypt` facade provides AES-256 encryption/decryption using the application's `APP_KEY`. The default cipher is `AES-256-CBC` (Laravel ≤10) or `AES-256-GCM` (Laravel 11+). GCM provides authenticated encryption (AEAD) — it verifies both confidentiality and integrity, preventing ciphertext tampering. CBC requires a separate HMAC for integrity (encrypt-then-MAC). The encryption key (`APP_KEY`) is derived from the base64-encoded key in `.env`. Rotating `APP_KEY` invalidates all encry...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: APP_KEY management (.env and APP_KEY), Related: Envelope encryption DEK/KEK (Sealcraft), Column-level RSA encryption with key rotation, Advanced Follow-up: Cipher migration from CBC to GCM, Custom encryption drivers, and Encrypted search (deterministic encryption for searchable fields)

## Dependency Graph
**Depends on:** Prerequisites: APP_KEY management (.env and APP_KEY), Related: Envelope encryption DEK/KEK (Sealcraft), Column-level RSA encryption with key rotation, Advanced Follow-up: Cipher migration from CBC to GCM, Custom encryption drivers, and Encrypted search (deterministic encryption for searchable fields)
**Depended on by:** Knowledge units that leverage or extend crypt facade patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for crypt facade.
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