# Decomposition: Middleware Testing

## Topic Overview
Testing middleware behavior — direct unit testing via handle() invocation, feature testing through HTTP, terminable middleware testing, parameterized middleware testing, and architecture testing.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
middleware-testing/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Middleware Testing
- **Purpose:** Testing middleware behavior — direct unit tests, feature tests, terminable middleware testing, and architecture tests.
- **Difficulty:** Intermediate
- **Dependencies:** Middleware Fundamentals, PHPUnit/Pest

## Dependency Graph
This KU depends on: Middleware Fundamentals, PHPUnit/Pest. It builds on custom-middleware and parameterized-middleware.

## Boundary Analysis
**In scope:** Three testing levels (direct unit, feature, architecture), what to test in middleware (pass-through, short-circuit, modification), direct handle() invocation with stub $next, dependency injection in middleware tests, feature test middleware assignment, withoutMiddleware() in tests, direct unit test pattern, feature test pattern, terminable middleware test pattern, parameterized middleware test pattern, architecture test pattern (Pest), direct unit vs feature test tradeoffs, mocking strategy.

**Out of scope:** Controller HTTP testing (controller-testing KU), action testing (action-testing KU), general PHPUnit/Pest patterns, specific middleware implementation testing details.

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