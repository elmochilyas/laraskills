# Decomposition: API Key Pattern

## Topic Overview
API keys are long-lived, static credentials used for machine-to-machine (M2M) authentication. Unlike user tokens tied to individual accounts, API keys identify an application, service, or team rather than a person. They are generated once, stored as hashed values, sent via `Authorization: Bearer` or a custom header (e.g., `X-API-Key`), and typically have broader permissions than user tokens. The API key pattern is essential for CI/CD pipelines, webhook callbacks, third-party integrations, and internal service communication where interactive login is not possible.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
api-key-pattern/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### API Key Pattern
- **Purpose:** API keys are long-lived, static credentials used for machine-to-machine (M2M) authentication. Unlike user tokens tied to individual accounts, API keys identify an application, service, or team rather than a person. They are generated once, stored as hashed values, sent via `Authorization: Bearer` or a custom header (e.g., `X-API-Key`), and typically have broader permissions than user tokens. The API key pattern is essential for CI/CD pipelines, webhook callbacks, third-party integrations, and internal service communication where interactive login is not possible.
- **Difficulty:** Intermediate
- **Dependencies:** sanctum-token-auth, signed-request-pattern, rate-limiting-by-auth-tier

## Dependency Graph
**Depends on:**
- sanctum-token-auth
- signed-request-pattern
- rate-limiting-by-auth-tier

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- API Key as service identity
- Key generation
- Key hashing
- Prefix for identification
- Key metadata

**Out of scope:**
- sanctum-token-auth topics covered in their respective KUs
- signed-request-pattern topics covered in their respective KUs
- rate-limiting-by-auth-tier topics covered in their respective KUs

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