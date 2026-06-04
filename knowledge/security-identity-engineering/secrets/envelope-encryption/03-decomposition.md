# Decomposition: envelope encryption

## Topic Overview

Envelope encryption encrypts data with a Data Encryption Key (DEK), then encrypts the DEK with a Key Encryption Key (KEK) stored in an external KMS (AWS KMS, GCP Cloud KMS, Azure Key Vault, HashiCorp Vault Transit). The `sealcraft` package implements this pattern for Laravel, providing a `Crypt` facade replacement that transparently handles DEK generation and KEK wrapping. The KEK never leaves the KMS — encryption/decryption of the DEK happens in the KMS via API calls. Rotating the KEK does...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
envelope-encryption/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### envelope encryption
- **Purpose:** Envelope encryption encrypts data with a Data Encryption Key (DEK), then encrypts the DEK with a Key Encryption Key (KEK) stored in an external KMS (AWS KMS, GCP Cloud KMS, Azure Key Vault, HashiCorp Vault Transit). The `sealcraft` package implements this pattern for Laravel, providing a `Crypt` facade replacement that transparently handles DEK generation and KEK wrapping. The KEK never leaves the KMS — encryption/decryption of the DEK happens in the KMS via API calls. Rotating the KEK does...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Laravel Crypt facade (AES-256-CBC/GCM), KMS fundamentals, Related: Column-level RSA encryption with key rotation, Zero-downtime key rotation (Locksmith), Advanced Follow-up: KMS key rotation strategies, Multi-region KMS replication, and DEK re-wrapping automation

## Dependency Graph
**Depends on:** Prerequisites: Laravel Crypt facade (AES-256-CBC/GCM), KMS fundamentals, Related: Column-level RSA encryption with key rotation, Zero-downtime key rotation (Locksmith), Advanced Follow-up: KMS key rotation strategies, Multi-region KMS replication, and DEK re-wrapping automation
**Depended on by:** Knowledge units that leverage or extend envelope encryption patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for envelope encryption.
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