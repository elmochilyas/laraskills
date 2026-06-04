# Decomposition: Request Transformation

## Topic Overview
Modifying requests in middleware — TrustedProxies, HandleCors, input sanitization, request enrichment via attributes, tenant resolution, locale detection, and the attributes vs input distinction.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
request-transformation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Request Transformation
- **Purpose:** Modifying requests in middleware — trusted proxies, CORS, input sanitization, request enrichment via attributes, and the attributes vs input distinction.
- **Difficulty:** Advanced
- **Dependencies:** Custom Middleware

## Dependency Graph
This KU depends on: Custom Middleware. It serves as prerequisite for cross-cutting-concerns.

## Boundary Analysis
**In scope:** Request as passable object (shared mutability), attributes vs input distinction, TrustedProxies mechanics (IP/scheme/host correction), HandleCors preflight handling, input sanitization (TrimStrings, ConvertEmptyStringsToNull), request enrichment via attributes, request ID generation pattern, tenant resolution pattern, locale detection pattern, Force JSON pattern, global vs group placement for transformations, caching transformed data.

**Out of scope:** Response transformation (response-transformation KU), parameterized middleware patterns (parameterized-middleware KU), general custom middleware creation (custom-middleware KU), CORS configuration specifics.

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