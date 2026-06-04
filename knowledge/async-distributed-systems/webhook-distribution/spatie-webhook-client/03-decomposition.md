# Decomposition: Spatie Laravel Webhook Client

## Topic Overview

Spatie's `laravel-webhook-client` package provides the receiving counterpart to the webhook server. It validates incoming webhook requests by verifying HMAC signatures, prevents replay attacks via timestamp checks, stores incoming calls in the database, and dispatches configurable handling jobs.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k067-spatie-webhook-client/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Spatie Laravel Webhook Client
- **Purpose:** Spatie's `laravel-webhook-client` package provides the receiving counterpart to the webhook server. It validates incoming webhook requests by verifying HMAC signatures, prevents replay attacks via timestamp checks, stores incoming calls in the database, and dispatches configurable handling jobs.
- **Difficulty:** Advanced
- **Dependencies:** - K066 Spatie Webhook Server (sending side)

## Dependency Graph

This KU depends on: - K066 Spatie Webhook Server (sending side)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Incoming webhook request**: An HTTP POST from a remote system, expected to contain a JSON payload, a `Signature` header, and optionally a `Timestamp` header. - **Signature validation**: The client...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization