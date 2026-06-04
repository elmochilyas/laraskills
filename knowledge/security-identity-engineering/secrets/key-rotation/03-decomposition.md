# Decomposition: key rotation

## Topic Overview

`laravel-locksmith` provides a recipe-based framework for zero-downtime API key rotation. It implements the dual-validity pattern: during rotation, both the old and new keys are accepted (grace period), then the old key is retired. Each "recipe" defines the key storage method, validation logic, and rotation process. Built-in recipes exist for Stripe, Twilio, and other services; custom recipes can be written for any API key pattern. The dual-validity grace period prevents downtime during async...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
key-rotation/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### key rotation
- **Purpose:** `laravel-locksmith` provides a recipe-based framework for zero-downtime API key rotation. It implements the dual-validity pattern: during rotation, both the old and new keys are accepted (grace period), then the old key is retired. Each "recipe" defines the key storage method, validation logic, and rotation process. Built-in recipes exist for Stripe, Twilio, and other services; custom recipes can be written for any API key pattern. The dual-validity grace period prevents downtime during async...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: API key management, .env and APP_KEY management, Related: HashiCorp Vault integration, Envelope encryption DEK/KEK (Sealcraft), Column-level RSA encryption with key rotation, Advanced Follow-up: Custom recipe development for internal services, Automated rotation with Vault integration, and Key rotation compliance auditing

## Dependency Graph
**Depends on:** Prerequisites: API key management, .env and APP_KEY management, Related: HashiCorp Vault integration, Envelope encryption DEK/KEK (Sealcraft), Column-level RSA encryption with key rotation, Advanced Follow-up: Custom recipe development for internal services, Automated rotation with Vault integration, and Key rotation compliance auditing
**Depended on by:** Knowledge units that leverage or extend key rotation patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for key rotation.
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