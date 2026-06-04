# Decomposition: Parameterized Middleware

## Topic Overview
Middleware that accepts parameters — colon-separated parameter syntax, extraction in the Pipeline, handle() signature with parameters, guard selection, rate limit configuration, and authorization ability patterns.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
parameterized-middleware/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Parameterized Middleware
- **Purpose:** Middleware that accepts parameters — colon-delimited syntax, parameter extraction in the Pipeline, and configurable middleware patterns.
- **Difficulty:** Advanced
- **Dependencies:** Custom Middleware

## Dependency Graph
This KU depends on: Custom Middleware. It serves as prerequisite for middleware-testing.

## Boundary Analysis
**In scope:** Colon-separated parameter syntax, parameter extraction in Pipeline::carry(), handle() signature with additional parameters, optional parameter defaults, variadic parameters (multiple guards), guard selection pattern, rate limit configuration pattern, named limiter pattern, authorization ability pattern, cache header pattern, parameters vs separate middleware classes decision, route caching with parameters.

**Out of scope:** Custom middleware creation basics (custom-middleware KU), rate limiting internals (Rate Limiting KU), authorization policy mechanics (Authorization KU), specific built-in middleware implementations.

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