# Decomposition: Signed Routes

## Topic Overview
Tamper-proof signed URLs using HMAC-SHA256 signatures for verifiable links without server-side storage.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
signed-routes/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Signed Routes
- **Purpose:** Tamper-proof signed URLs
- **Difficulty:** Intermediate
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for Security & Identity Engineering patterns.

## Boundary Analysis
**In scope:** HMAC-SHA256 signing mechanism, temporary signed routes with expiry, APP_KEY dependency, key rotation support via keyResolver, ValidateSignature middleware, signed vs signed.relative variants, URL as bearer token mental model, self-contained vs database-backed tradeoffs, reverse proxy HTTPS configuration, single-use semantics via cache.
**Out of scope:** Named route generation basics (route-name-generation KU), token-based authentication (Security domain), email verification implementation (Feature domain), password reset flows (Feature domain).

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