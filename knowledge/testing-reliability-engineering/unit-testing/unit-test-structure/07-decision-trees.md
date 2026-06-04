# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Unit Test Structure
**Generated:** 2026-06-03

---

# Decision Inventory

1. Unit test vs feature test selection
2. State verification vs interaction verification
3. Real instance vs mock for dependencies
4. Framework boot vs #[UnitTest] attribute

---

# Architecture-Level Decision Trees

---

## Decision Name: Unit Test vs Feature Test Selection

---

## Decision Context

Choose whether to write a unit test or a feature test for a given scenario.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Code touches database, HTTP, cache, queue, or filesystem?
↓
YES → Write a feature test (needs framework boot)
NO → Continue

↓
Code is pure business logic (calculations, transformations, validations)?
↓
YES → Write a unit test with `#[UnitTest]` (<1ms, no framework)
NO → Code orchestrates multiple services?
↓
YES → Write a feature test (tests integration)
NO → Write a unit test (isolated behavior)

---

## Rationale

Unit tests without framework boot execute in <1ms vs ~30-50ms for feature tests. Pure business logic doesn't need the framework. Database, HTTP, and filesystem operations require the framework.

---

## Recommended Default

**Default:** Feature test for anything touching framework services; unit test for pure logic
**Reason:** Feature tests catch integration bugs; unit tests provide fast TDD feedback for business logic.

---

## Risks Of Wrong Choice

Unit tests for database code are slow and miss real DB behavior. Feature tests for pure calculations are 30-50x slower than necessary.

---

## Related Rules

Rule 1: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly

---

## Related Skills

Structure Unit Tests with AAA and Descriptive Naming

---

## Decision Name: State Verification vs Interaction Verification

---

## Decision Context

Choose whether to assert the result of a method (state) or verify that a specific method was called (interaction).

---

## Decision Criteria

* maintainability

---

## Decision Tree

Method has a return value that can be asserted?
↓
YES → Use state verification (`expect($result)->toBe(4)`) — preferred
NO → Continue

↓
Only observable effect is which methods were called on dependencies?
↓
YES → Use interaction verification (e.g., command dispatcher routing)
NO → Refactor code to return a value or produce observable state

---

## Rationale

State verification tests the actual behavior and doesn't break on refactoring. Interaction verification tests implementation details and is brittle.

---

## Recommended Default

**Default:** State verification whenever possible
**Reason:** Tests don't break on refactoring. Higher confidence in behavior correctness.

---

## Risks Of Wrong Choice

Interaction-based tests break on every refactoring, creating high maintenance cost and discouraging code improvement.

---

## Related Rules

Rule 2: Prefer state verification over interaction verification

---

## Related Skills

Structure Unit Tests with AAA and Descriptive Naming

---

## Decision Name: Real Instance vs Mock for Dependencies

---

## Decision Context

Choose whether to use a real implementation or a mock for a dependency in a unit test.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Dependency is a value object or collection?
↓
YES → Use real instance (`new Email('test@example.com')`) — simpler, reliable
NO → Continue

↓
Dependency makes network calls, DB queries, or file I/O?
↓
YES → Mock the dependency (isolates from side effects)
NO → Dependency has complex or non-deterministic behavior?
↓
YES → Mock or stub the dependency
NO → Use real instance

---

## Rationale

Mocking value objects adds zero value and creates brittle tests. Mocking service boundaries (network, DB, filesystem) is necessary for isolation.

---

## Recommended Default

**Default:** Real instances for pure logic and value objects; mocks at service boundaries
**Reason:** Balances test simplicity with proper isolation.

---

## Risks Of Wrong Choice

Over-mocking creates brittle tests that break on refactoring. Under-mocking creates slow tests with real side effects.

---

## Related Rules

Rule 2: Prefer state verification over interaction verification

---

## Related Skills

Structure Unit Tests with AAA and Descriptive Naming
