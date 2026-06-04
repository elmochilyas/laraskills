# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Testing Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Test Coverage Strategy

---

## Decision Context

Determining the appropriate test coverage for a controller action — which test types are necessary for each action.

---

## Decision Criteria

* architectural
* security
* maintainability

---

## Decision Tree

For each controller action, what test cases should be written?
├── Happy path → Test that the action returns correct status and data
│   ├── index: assert 200 + JSON structure + pagination meta
│   ├── store: assert 201 + resource structure + database persistence
│   ├── show: assert 200 + resource structure
│   ├── update: assert 200 + fresh data + database change
│   └── destroy: assert 204 + database removal
├── Authorization → Test unauthenticated and unauthorized access
│   ├── Guest: assert 401 Unauthenticated
│   └── Wrong role: assert 403 Forbidden
├── Validation (store/update) → Test failure modes
│   ├── Missing required fields: assert 422 + validation errors
│   ├── Invalid formats: assert 422
│   └── Unique constraint: assert 422
└── Edge cases → Test boundary conditions
    ├── 404 for non-existent resource
    ├── Empty collection for index
    └── Soft-deleted resource access

---

## Rationale

Happy-path-only testing misses error responses that crash clients. Comprehensive testing includes authorization, validation, and edge case scenarios that are exercised frequently in production.

---

## Recommended Default

**Default:** 4 tests per action (happy path + auth + validation + edge case) = 20 tests per 5-action controller
**Reason:** Balances test coverage with maintenance cost; covers 90%+ of failure modes.

---

## Risks Of Wrong Choice

No auth tests leave authorization gaps undetected. No validation tests crash API clients on malformed input. No database assertions miss persistence bugs.

---

## Related Rules

* Write HTTP Tests For Controllers, Not Unit Tests
* Always Test Failure Paths Per Action
* Use assertJsonStructure For Shape Validation
* Assert Database State For Mutating Actions

---

## Related Skills

* Test Controller Actions via Feature or Integration Tests
