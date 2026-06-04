# Decomposition: Signed Request Pattern

## Topic Overview
A signed request pattern (also called HMAC request signing) verifies the authenticity and integrity of an HTTP request by including a cryptographic signature computed from the request body, headers, and a shared secret. The receiver recomputes the signature using the same secret and rejects the request if the signatures do not match. This pattern is essential for webhook callbacks, M2M communication without bearer tokens, API idempotency guarantees, and scenarios where request integrity (not just authentication) must be guaranteed.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
signed-request-pattern/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Signed Request Pattern
- **Purpose:** A signed request pattern (also called HMAC request signing) verifies the authenticity and integrity of an HTTP request by including a cryptographic signature computed from the request body, headers, and a shared secret. The receiver recomputes the signature using the same secret and rejects the request if the signatures do not match. This pattern is essential for webhook callbacks, M2M communication without bearer tokens, API idempotency guarantees, and scenarios where request integrity (not just authentication) must be guaranteed.
- **Difficulty:** Intermediate
- **Dependencies:** api-key-pattern, api-specific-middleware

## Dependency Graph
**Depends on:**
- api-key-pattern
- api-specific-middleware

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- HMAC (Hash-based Message Authentication Code)
- Signature
- Nonce
- Timestamp
- Replay attack
- Shared secret

**Out of scope:**
- api-key-pattern topics covered in their respective KUs
- api-specific-middleware topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization