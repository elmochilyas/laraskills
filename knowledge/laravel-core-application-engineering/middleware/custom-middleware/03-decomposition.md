# Decomposition: Custom Middleware

## Topic Overview
Creating custom middleware classes — handle() contract, three execution paths (pass through, short-circuit, modify and pass), constructor injection, and single-concern design.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
custom-middleware/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Custom Middleware
- **Purpose:** Creating custom middleware classes — handle() contract, constructor injection, three execution paths, and single-concern middleware design.
- **Difficulty:** Intermediate
- **Dependencies:** Middleware Fundamentals

## Dependency Graph
This KU depends on: Middleware Fundamentals. It serves as prerequisite for parameterized-middleware, terminable-middleware, request-transformation, response-transformation, middleware-testing.

## Boundary Analysis
**In scope:** handle() contract (Request, Closure $next, Response), three execution paths (pass through, short-circuit, modify and pass), constructor injection for middleware, closure middleware, guard middleware pattern, logging middleware pattern, request enrichment pattern, short-circuit pattern, single middleware vs middleware chain decision, naming conventions, registration documentation.

**Out of scope:** Parameterized middleware specifics (parameterized-middleware KU), terminable middleware (terminable-middleware KU), request transformation patterns (request-transformation KU), response transformation patterns (response-transformation KU), testing middleware (middleware-testing KU).

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