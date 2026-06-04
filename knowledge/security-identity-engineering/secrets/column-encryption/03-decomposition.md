# Decomposition: column encryption

## Topic Overview

Column-level encryption in Laravel is implemented via packages like `EloquentEncryption` which transparently encrypt/decrypt specific model attributes using RSA public-key cryptography. Each user (or record owner) has an RSA key pair. Data is encrypted with the user's public key and can only be decrypted with the corresponding private key. Key rotation generates a new RSA key pair and re-encrypts all data for that user. This pattern is useful for scenarios where different users should not be ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
column-encryption/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### column encryption
- **Purpose:** Column-level encryption in Laravel is implemented via packages like `EloquentEncryption` which transparently encrypt/decrypt specific model attributes using RSA public-key cryptography. Each user (or record owner) has an RSA key pair. Data is encrypted with the user's public key and can only be decrypted with the corresponding private key. Key rotation generates a new RSA key pair and re-encrypts all data for that user. This pattern is useful for scenarios where different users should not be ...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Laravel Crypt facade (AES-256-CBC/GCM), Envelope encryption DEK/KEK, Related: Secrets scanning and detection tools, Zero-downtime key rotation, Advanced Follow-up: Hybrid encryption (RSA + AES) for long fields, Deterministic encryption for searchable encrypted fields, and FPE (Format-Preserving Encryption) for legacy system compatibility

## Dependency Graph
**Depends on:** Prerequisites: Laravel Crypt facade (AES-256-CBC/GCM), Envelope encryption DEK/KEK, Related: Secrets scanning and detection tools, Zero-downtime key rotation, Advanced Follow-up: Hybrid encryption (RSA + AES) for long fields, Deterministic encryption for searchable encrypted fields, and FPE (Format-Preserving Encryption) for legacy system compatibility
**Depended on by:** Knowledge units that leverage or extend column encryption patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for column encryption.
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