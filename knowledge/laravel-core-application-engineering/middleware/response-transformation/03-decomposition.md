# Decomposition: Response Transformation

## Topic Overview
Modifying responses in middleware — security headers, cache control, CORS headers, response timing, JSON envelope wrapping, and ETag generation.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
response-transformation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Response Transformation
- **Purpose:** Modifying responses in middleware — security headers, cache control, CORS headers, response timing, ETag generation, and JSON envelope wrapping.
- **Difficulty:** Advanced
- **Dependencies:** Custom Middleware

## Dependency Graph
This KU depends on: Custom Middleware. It serves as prerequisite for cross-cutting-concerns.

## Boundary Analysis
**In scope:** Post-processing position (after $next($request)), response mutability by type (BinaryFileResponse, StreamedResponse, JsonResponse), SetCacheHeaders middleware (cache control directives, ETag generation, 304 responses), CORS header addition, security headers pattern (CSP, HSTS, XFO, XCTO), response timing pattern, JSON envelope pattern, security headers in middleware vs web server, cache headers at route vs middleware level, response middleware ordering considerations.

**Out of scope:** Request transformation (request-transformation KU), custom middleware basics (custom-middleware KU), parameterized cache headers syntax (parameterized-middleware KU), CSP configuration specifics.

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