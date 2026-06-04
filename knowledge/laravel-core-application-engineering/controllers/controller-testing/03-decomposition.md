# Decomposition: Controller Testing

## Topic Overview
Testing strategies for Laravel controllers — response assertions, mocking, authentication in tests, patterns for resource/API/auth/middleware testing, and architectural decisions around test structure.

## Decomposition Strategy
This Knowledge Unit is overloaded at 733 lines. It covers three independently teachable sub-topics with different tradeoffs, decisions, and learning paths. Splitting into 3 units improves searchability and allows each to evolve independently.

## Proposed Folder Structure
```
controller-testing/
  ├── 03-decomposition.md
  ├── controller-testing-fundamentals/
  │   └── 02-knowledge-unit.md
  ├── controller-testing-patterns/
  │   └── 02-knowledge-unit.md
  └── controller-testing-architecture/
      └── 02-knowledge-unit.md
```

## Knowledge Unit Inventory

### Controller Testing Fundamentals
- **Purpose:** Core testing toolkit — response assertions, fluent JSON testing, actingAs, mocking/spying, withoutMiddleware, TestResponse internals.
- **Difficulty:** Intermediate
- **Dependencies:** PHPUnit/Pest, Controller Architecture

### Controller Testing Patterns
- **Purpose:** Seven concrete test patterns covering resource, API, auth, validation, middleware, single-action controller, and soft-deleted resource testing.
- **Difficulty:** Intermediate
- **Dependencies:** Controller Testing Fundamentals

### Controller Testing Architecture
- **Purpose:** Architectural decisions, tradeoff tables (feature vs unit, real DB vs SQLite), CI strategy, common mistakes, failure modes, coverage targets.
- **Difficulty:** Advanced
- **Dependencies:** Controller Testing Fundamentals, Controller Testing Patterns

## Dependency Graph
Controller Testing Fundamentals
↓
Controller Testing Patterns
↓
Controller Testing Architecture

## Boundary Analysis
**Controller Testing Fundamentals:** Response status/view/json/redirect assertions, `actingAs`, `mock`/`spy`, `withoutMiddleware`, `TestResponse` internal mechanics, `AssertableJson` fluent API.
**Controller Testing Patterns:** Resource controller test suite, authorization tests, API JSON response tests, validation error tests (including Pest datasets), middleware behavior tests, single-action controller tests.
**Controller Testing Architecture:** Feature vs unit decisions, DatabaseTransactions vs RefreshDatabase, mock placement (service boundaries, not controller boundaries), CI pipeline, flaky tests, performance optimization, coverage targets.

**Out of scope (belongs elsewhere):** Action testing (action-testing KU), service testing (service-testing KU), middleware testing (middleware-testing KU), E2E/browser testing (separate domain).

## Future Expansion Opportunities
- Parallel test execution patterns
- Snapshot testing for API responses
- Property-based testing for controller inputs
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization