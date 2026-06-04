# Decomposition: http test helpers

## Topic Overview

Laravel's HTTP test helpers simulate full HTTP requests (GET, POST, PUT, PATCH, DELETE, OPTIONS) through the application's routing, middleware, and controller layers. They are the primary tool for feature tests, which constitute ~70% of a standard Laravel test suite. The helpers boot the framework, dispatch a request through the Kernel pipeline, and return a `TestResponse` with ~50 fluent assertion methods. Understanding this lifecycle is essential for writing tests that catch real user-facin...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
http-test-helpers/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### http test helpers
- **Purpose:** Laravel's HTTP test helpers simulate full HTTP requests (GET, POST, PUT, PATCH, DELETE, OPTIONS) through the application's routing, middleware, and controller layers. They are the primary tool for feature tests, which constitute ~70% of a standard Laravel test suite. The helpers boot the framework, dispatch a request through the Kernel pipeline, and return a `TestResponse` with ~50 fluent assertion methods. Understanding this lifecycle is essential for writing tests that catch real user-facin...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Laravel routing, Middleware pipeline, Eloquent basics, **Related Topics**: JSON API testing, Authentication testing, Validation testing, View/Blade testing, **Advanced Follow-up**: Custom assertion macros, TestResponse macros, and Middleware testing patterns

## Dependency Graph
**Depends on:** **Prerequisites**: Laravel routing, Middleware pipeline, Eloquent basics, **Related Topics**: JSON API testing, Authentication testing, Validation testing, View/Blade testing, **Advanced Follow-up**: Custom assertion macros, TestResponse macros, and Middleware testing patterns
**Depended on by:** Knowledge units that leverage or extend http test helpers patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for http test helpers.
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