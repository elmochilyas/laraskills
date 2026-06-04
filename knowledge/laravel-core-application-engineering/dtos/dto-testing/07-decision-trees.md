# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Contract Tests vs Implementation Tests
* Data Provider vs Separate Test Methods
* CI Pipeline Order

---

# Architecture-Level Decision Trees

---

## Decision 1: Contract Tests vs Implementation Tests

---

## Decision Context

Whether to write tests that verify the DTO's observable behavior (contract) or tests that verify internal implementation details (how it works).

---

## Decision Criteria

* Whether the test verifies external behavior or internal mechanisms
* Whether the test would survive refactoring
* Whether the test provides value in catching regressions
* Whether PHP already enforces the behavior being tested

---

## Decision Tree

Does the test verify observable behavior (property values, output shape, exception on invalid input)?
↓
YES → Contract test — good. Does PHP already enforce this behavior natively?
    YES (e.g., `public string $name` — PHP ensures `$name` is a string) → Skip — no value added
    NO (e.g., `fromArray()` mapping, `toArray()` output shape, validation rule) → Write contract test
NO → Does the test verify internal implementation (which constructor was called, how many times)?
    YES → Implementation test — avoid. These break on refactoring and provide false confidence.
NO → Does the test mock the DTO itself or its constructor?
    YES → Implementation test — avoid. Test the real DTO with real data.

---

## Rationale

Contract tests verify what the DTO does (observable behavior) and survive refactoring. Implementation tests verify how the DTO works (internal mechanisms) and break when the implementation changes, even if behavior is identical. PHP's native type system already enforces type hints — testing them adds no value.

---

## Recommended Default

**Default:** Write contract tests for factory methods (mapping correctness), output methods (shape verification), and validation (rejection of invalid input). Skip tests for PHP-enforced type hints.
**Reason:** Contract tests provide regression protection and documentation. Implementation tests add maintenance burden without corresponding value.

---

## Risks Of Wrong Choice

* Implementation test: Breaks on every refactoring, provides false confidence
* Over-testing PHP types: `assertIsString($dto->name)` when `public string $name` is declared — PHP already enforces
* No DTO tests: Mapping errors in factory methods go undetected until downstream services fail

---

## Related Rules

* Test the DTO's Contract, Not Its Implementation (05-rules.md)
* Test Every Factory Method with at Least One Valid-Input Test (05-rules.md)
* Test Output Methods for Expected Shape, Keys, Types, and Null Handling (05-rules.md)

---

## Related Skills

* Skill: Write DTO Contract Tests

---

## Decision 2: Data Provider vs Separate Test Methods

---

## Decision Context

Whether to use PHPUnit data providers for multiple construction variants or write separate test methods for each variant.

---

## Decision Criteria

* Number of construction variants (valid input combinations)
* Whether variants differ in expected outcome or just input values
* Whether the DTO has optional fields requiring null-handling variants
* Whether the DTO has validation rules requiring distinct rejection paths

---

## Decision Tree

How many construction variants need testing?
↓
1 → Single test method — no data provider needed
2-3 → Data provider recommended — reduces test method count
4+ → Data provider required — keep test methods manageable
NO → Do variants differ in expected exception (different validation paths)?
    YES → Separate test methods — each expects a different exception type or message
    NO → Do variants differ only in input/output values (same structure, different data)?
        YES → Data provider — single test method with multiple data sets
        NO → Separate methods — each variant tests a distinct behavior
NO → Does the DTO have optional fields needing null-handling coverage?
    YES → Data provider — test full data, minimal data, and edge cases
    NO → Single test method sufficient

---

## Rationale

Data providers eliminate test method duplication. A single test + data provider covers 5-10 construction variants that would otherwise require separate test methods. When the DTO adds a field, update the data provider in one place rather than modifying every test method. However, distinct validation paths with different expected exceptions should remain separate methods for clarity.

---

## Recommended Default

**Default:** Data providers for construction variants (different input combinations); separate methods for distinct validation paths (different expected exceptions)
**Reason:** Data providers reduce duplication for value variants. Separate methods keep exception expectations clear and focused.

---

## Risks Of Wrong Choice

* Separate methods for every variant: Excessive test method count, hard to maintain
* Data provider for different exceptions: Mixed expectations in one test — unclear which assertion belongs to which input
* Stale data provider: Adding a DTO field without updating the data provider — missing coverage

---

## Related Rules

* Use Data Providers for Construction Variants (05-rules.md)
* Test Invalid Input Rejection with Explicit Validation Test Cases (05-rules.md)

---

## Related Skills

* Skill: Write DTO Contract Tests

---

## Decision 3: CI Pipeline Order

---

## Decision Context

Where DTO tests run in the CI pipeline relative to other test categories.

---

## Decision Criteria

* Whether DTO tests are the fastest category (<50ms for a full suite)
* Whether downstream tests depend on data contracts being correct
* CI time optimization and developer feedback speed

---

## Decision Tree

Does the CI provider support custom stage ordering?
↓
YES → Configure DTO tests as the first test stage — fastest feedback on data contract breakage
NO → Can tests be parallelized?
    YES → Run DTO tests in the first parallel batch — ensure they start first
    NO → Run DTO tests before any test that requires a database or HTTP kernel
NO → Are DTO tests the fastest test category?
    YES → They should run first — if a DTO test fails, all downstream tests are potentially invalid
    NO → Regardless of relative speed, DTO tests should run first because they validate foundational contracts
NO → Would a DTO failure invalidate downstream test results?
    YES → DTO tests must run first — failing early saves CI minutes and developer time
    NO → DTO tests can run in any order, but first is still preferred

---

## Rationale

DTO tests are the fastest tests in the application (<1ms each, no database, no HTTP, no service container). They validate the data contract that all downstream layers depend on. If a DTO test fails, every subsequent test stage (service, action, HTTP, integration) is potentially invalid. Running them first provides the fastest possible feedback cycle and saves CI compute minutes.

---

## Recommended Default

**Default:** Configure DTO tests as the first CI stage — before static analysis, unit tests, feature tests, and integration tests
**Reason:** DTO tests complete in <50ms for a full suite. A failure here invalidates all downstream stages. Early detection saves CI time and developer feedback cycles.

---

## Risks Of Wrong Choice

* DTO tests last in CI: 8+ minutes of CI time wasted when a DTO test fails at the end
* DTO tests after integration tests: Developers wait for slow tests before learning about data contract issues
* No stage ordering: DTO tests run interleaved with slower tests, delaying failure detection

---

## Related Rules

* Run DTO Tests First in the CI Pipeline (05-rules.md)

---

## Related Skills

* Skill: Write DTO Contract Tests

