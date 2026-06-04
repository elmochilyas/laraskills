# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Authorization Testing
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | HTTP Integration vs Unit Tests for Authorization | Testing approach selection | maintainability, reliability |
| 2 | Positive vs Negative Test Coverage Scope | Which authorization scenarios to test | security, maintainability |
| 3 | Permission Matrix Organization | Structuring authorization test data | maintainability, readability |

---

# Architecture-Level Decision Trees

---

## HTTP Integration vs Unit Tests for Authorization

---

## Decision Context

Whether to test authorization via HTTP integration tests (full request/response) or direct Gate/Policy unit tests.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Does the test need to validate the full middleware + controller flow?
↓
YES → HTTP integration test (actingAs + assertStatus)
NO → Does the test only verify authorization logic (Gate/Policy boolean)?
    YES → Unit test (assertTrue/assertFalse on $user->can())
    NO → HTTP integration test (comprehensive)

Is speed a concern (many authorization combinations)?
↓
YES → Unit tests (faster, no HTTP overhead)
NO → HTTP integration tests (more comprehensive)

Do you need to verify specific HTTP responses (401 vs 403 vs 200)?
↓
YES → HTTP integration test (validates exact response code)
NO → Unit test (boolean authorization check is sufficient)

---

## Rationale

HTTP integration tests validate the full stack — middleware, authentication, authorization, and response. Unit tests are faster and better for testing many authorization combinations (permission matrices). The best approach is a mix: unit tests for the authorization matrix (all user types × all actions) and HTTP tests for critical flows (login, admin access).

---

## Recommended Default

**Default:** HTTP integration tests for critical paths; unit tests (data provider) for exhaustive permission matrix
**Reason:** HTTP tests validate real request flow. Unit tests with data providers enable comprehensive coverage of all user type × action combinations without excessive test execution time.

---

## Risks Of Wrong Choice

- HTTP only for all combinations: slow test suite, difficult to maintain
- Unit tests only: missing middleware/controller authorization integration
- No authorization tests: authorization bugs undetected until production
- Testing only positive cases: false confidence in authorization

---

## Related Rules

- Test Both Positive and Negative Authorization Cases (05-rules.md)
- Test Model-Specific Scoping (05-rules.md)
- Test Unauthenticated Access Returns 401 or 403 (05-rules.md)

---

## Related Skills

- Test Authorization Policies, Gates, and Permissions (06-skills.md)

---

## Positive vs Negative Test Coverage Scope

---

## Decision Context

Determining which authorization scenarios to test — positive (allowed), negative (denied), and edge cases.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

For every Gate/Policy method, are there both positive and negative tests?
↓
YES → Continue to edge cases
NO → Add missing cases — positive without negative is incomplete

Are the following edge cases covered?
- Unauthenticated (guest) access → Returns 401/403
- Model-specific ownership (User A cannot modify User B's resource) → Returns 403
- Super-admin bypass → Super-admin CAN access all resources
- Soft-deleted resources → Behavior matches expectations
- Suspended/inactive users → Returns 403

Are cross-tenant access tests present (if multi-tenant)?
↓
YES → Tenant isolation verified
NO → Add cross-tenant access tests

---

## Rationale

Positive tests alone give false confidence — a policy that always returns `true` passes all positive tests. Negative tests prove the authorization actually restricts access. Edge cases (guest, ownership, super-admin, soft-delete, deactivated users) cover the most common authorization failure scenarios.

---

## Recommended Default

**Default:** Every Gate/Policy method: 1 positive + 1 negative test + relevant edge cases (guest, ownership, super-admin)
**Reason:** Positive + negative pairs validate the authorization logic. Edge cases cover real-world scenarios that generic tests miss. This combination provides comprehensive coverage without testing every possible attribute combination.

---

## Risks Of Wrong Choice

- Positive-only tests: policy always returns true, test passes, production unprotected
- No edge case tests: guest access allowed, ownership bypass, super-admin broken
- Testing only HTTP 200/403: missing soft-delete, suspended user, deactivated scenarios
- No permission cache test: permission changes not reflected until cache cleared

---

## Related Rules

- Test Both Positive and Negative Authorization Cases (05-rules.md)
- Test Model-Specific Scoping (05-rules.md)
- Test Unauthenticated Access Returns 401 or 403 (05-rules.md)

---

## Related Skills

- Test Authorization Policies, Gates, and Permissions (06-skills.md)

---

## Permission Matrix Organization

---

## Decision Context

How to structure authorization test data — individual test methods vs data provider with matrix.

---

## Decision Criteria

* maintainability
* readability

---

## Decision Tree

How many authorization scenarios exist?
↓
<10 → Individual test methods (simple, readable)
10-50 → Data provider with permission matrix (DRY, maintainable)
50+ → Data provider with generated matrix or external data file

Are the user types and expected outcomes stable?
↓
YES → Data provider (static matrix, no frequent changes)
NO → Individual test methods (easier to update when matrix churns)

Do you need to test the same user type across multiple actions?
↓
YES → Data provider (reuse user factory logic)
NO → Individual tests fine

---

## Rationale

Data providers with permission matrices eliminate test duplication. Each row is a `[user_type, action, resource, expected_result]` tuple. Individual tests are better when scenarios are few or when complex setup per scenario doesn't benefit from a shared provider.

---

## Recommended Default

**Default:** PHPUnit data provider with a permission matrix for all authorization checks; individual tests only for complex edge cases with non-standard setup
**Reason:** Data providers reduce boilerplate and make the permission matrix visible in a single location. Adding a new user type or action requires adding one row, not a new test method.

---

## Risks Of Wrong Choice

- Individual tests for many scenarios: hundreds of test methods, massive duplication, hard to audit
- Data provider for complex setup: shared setup logic becomes complicated with conditionals
- No permission matrix: authorization coverage is ad-hoc and incomplete
- Data provider without named datasets: failing tests show unhelpful "[data set 5]" messages

---

## Related Rules

- Test Both Positive and Negative Authorization Cases (05-rules.md)
- Test Model-Specific Scoping (05-rules.md)

---

## Related Skills

- Test Authorization Policies, Gates, and Permissions (06-skills.md)
